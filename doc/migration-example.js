// 数据迁移云函数示例
// 文件名: cloudfunctions/migrateVehicles/index.js

const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const userCollection = db.collection("users");
const vehiclesCollection = db.collection("vehicles");

// 批量获取数据的函数
async function getAllDocuments(collection, query = {}, limit = 100) {
  const countResult = await collection.where(query).count();
  const total = countResult.total;
  const batchTimes = Math.ceil(total / limit);
  const tasks = [];

  for (let i = 0; i < batchTimes; i++) {
    const promise = collection
      .where(query)
      .skip(i * limit)
      .limit(limit)
      .get();
    tasks.push(promise);
  }

  // 等待所有数据获取完成
  const results = await Promise.all(tasks);
  return {
    data: results.reduce((acc, cur) => {
      return acc.concat(cur.data);
    }, []),
    total,
  };
}

exports.main = async (event, context) => {
  try {
    // 只获取包含vehicles数组的用户
    const usersResult = await getAllDocuments(userCollection, {
      vehicles: db.command.exists(true),
    });

    const users = usersResult.data;
    console.log(`找到 ${users.length} 个包含车辆信息的用户`);

    // 统计需要迁移的车辆总数
    let totalVehicles = 0;
    users.forEach((user) => {
      if (Array.isArray(user.vehicles)) {
        totalVehicles += user.vehicles.length;
      }
    });
    console.log(`需要迁移的车辆总数: ${totalVehicles}`);

    // 计数器
    let migratedCount = 0;
    let errorCount = 0;

    // 对每个用户进行处理
    for (const user of users) {
      if (!Array.isArray(user.vehicles) || user.vehicles.length === 0) {
        continue;
      }

      try {
        // 为每个车辆创建新记录
        for (const vehicle of user.vehicles) {
          try {
            await vehiclesCollection.add({
              data: {
                _openid: user._openid,
                userId: user._id,
                createTime: db.serverDate(),
                updateTime: db.serverDate(),
                plate: vehicle.plate || "",
                brand: vehicle.brand || "",
                model: vehicle.model || "",
                color: vehicle.color || "",
              },
            });
            migratedCount++;
          } catch (vehicleError) {
            console.error(`添加车辆记录失败: ${vehicleError.message}`);
            errorCount++;
          }
        }

        // 从用户记录中移除vehicles数组
        await userCollection.doc(user._id).update({
          data: {
            vehicles: db.command.remove(),
          },
        });

        console.log(`用户 ${user._id} 的 ${user.vehicles.length} 辆车迁移完成`);
      } catch (userError) {
        console.error(`处理用户 ${user._id} 失败: ${userError.message}`);
        errorCount++;
      }
    }

    return {
      success: true,
      stats: {
        usersProcessed: users.length,
        totalVehicles: totalVehicles,
        migratedVehicles: migratedCount,
        errors: errorCount,
      },
    };
  } catch (err) {
    console.error(`迁移过程出错: ${err.message}`);
    return {
      success: false,
      error: err.message,
    };
  }
};
