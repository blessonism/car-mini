// 云函数：updateUserVehicles
const cloud = require("wx-server-sdk");

// 初始化云函数
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  if (!openid) {
    return {
      code: 1,
      msg: "获取用户身份失败",
    };
  }

  try {
    const { action, vehicle, vehicleId } = event;
    const vehiclesCollection = db.collection("vehicles");

    // 查询用户信息确保用户存在
    const userCollection = db.collection("users");
    const userResult = await userCollection
      .where({
        _openid: openid,
      })
      .get();

    if (userResult.data.length === 0) {
      return {
        code: 1,
        msg: "用户不存在",
      };
    }

    const userData = userResult.data[0];
    let resultVehicles = [];

    switch (action) {
      case "add":
        // 添加新车辆
        if (!vehicle) {
          return {
            code: 1,
            msg: "车辆信息不能为空",
          };
        }

        // 向vehicles集合添加车辆
        // 注意：我们同时存储_openid和userId两个字段作为双重关联
        // _openid用于权限控制和快速查询
        // userId用于与用户表建立明确的关系，以适应可能的数据库结构变化
        const newVehicle = {
          ...vehicle,
          _openid: openid,
          userId: userData._id, // 关联到用户ID
          createTime: db.serverDate(),
          updateTime: db.serverDate(),
        };

        const addResult = await vehiclesCollection.add({
          data: newVehicle,
        });

        if (!addResult._id) {
          return {
            code: 1,
            msg: "添加车辆失败",
          };
        }
        break;

      case "update":
        // 更新现有车辆
        if (!vehicle || !vehicleId) {
          return {
            code: 1,
            msg: "缺少车辆信息或ID",
          };
        }

        // 确认车辆归属于该用户 - 使用_openid进行权限验证
        const vehicleToUpdate = await vehiclesCollection.doc(vehicleId).get();
        if (!vehicleToUpdate.data || vehicleToUpdate.data._openid !== openid) {
          return {
            code: 1,
            msg: "无权更新此车辆",
          };
        }

        // 更新车辆信息
        await vehiclesCollection.doc(vehicleId).update({
          data: {
            ...vehicle,
            updateTime: db.serverDate(),
          },
        });
        break;

      case "remove":
        // 删除车辆
        if (!vehicleId) {
          return {
            code: 1,
            msg: "缺少车辆ID",
          };
        }

        // 确认车辆归属于该用户 - 使用_openid进行权限验证
        const vehicleToRemove = await vehiclesCollection.doc(vehicleId).get();
        if (!vehicleToRemove.data || vehicleToRemove.data._openid !== openid) {
          return {
            code: 1,
            msg: "无权删除此车辆",
          };
        }

        // 删除车辆
        await vehiclesCollection.doc(vehicleId).remove();
        break;

      default:
        return {
          code: 1,
          msg: "不支持的操作类型",
        };
    }

    // 获取该用户的所有车辆 - 查询使用_openid做索引，提高查询效率
    const userVehicles = await vehiclesCollection
      .where({
        _openid: openid,
      })
      .orderBy("createTime", "desc")
      .get();

    return {
      code: 0,
      msg: "操作成功",
      data: {
        vehicles: userVehicles.data || [],
      },
    };
  } catch (err) {
    console.error("处理车辆信息失败", err);
    return {
      code: 1,
      msg: "处理车辆信息失败: " + err.message,
    };
  }
};
