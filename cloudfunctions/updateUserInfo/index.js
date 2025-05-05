// 云函数入口文件
const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const userCollection = db.collection("users");
const _ = db.command; // 获取数据库命令对象

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  if (!openid) {
    return {
      code: 1,
      msg: "未获取到用户身份",
    };
  }

  // 直接从 event 中获取要更新的数据
  // 前端传递的是 { phone: "...", name: "...", gender: "..." }
  // 确保只提取需要的字段，避免传入无关字段
  const { phone, name, gender } = event;

  // 验证传入的数据
  if (!phone || !name || gender === undefined || gender === null) {
    return {
      code: 1,
      msg: "缺少必要的更新信息 (phone, name, gender)",
    };
  }

  const updateData = {
    phone: phone,
    name: name,
    gender: gender,
    updateTime: db.serverDate(),
  };

  try {
    // 直接尝试更新用户信息，不再检查用户是否存在
    // 因为能调用这个函数，理论上用户应该已通过 login 创建
    // 如果用户真的不存在，update 会失败，由 catch 处理
    const updateResult = await userCollection
      .where({
        _openid: openid,
      })
      .update({
        data: updateData,
      });

    // 检查更新操作影响的记录数
    if (updateResult.stats.updated === 0) {
      // 虽然 where 匹配到了，但可能因为数据完全相同或其他原因未更新
      // 或者 where 条件 (_openid: openid) 未匹配到任何记录
      console.warn(`更新用户信息操作未更新任何记录, openid: ${openid}`);
      // 可以选择返回成功，因为数据可能已存在或用户不存在
      // 或者返回特定错误码提示前端
      // 这里我们假设如果用户不存在，也算"更新失败"
      const userExists = await userCollection
        .where({ _openid: openid })
        .count();
      if (userExists.total === 0) {
        return {
          code: 1,
          msg: "用户不存在，无法更新",
        };
      } else {
        // 用户存在但未更新（可能数据相同），可以视为成功
        return {
          code: 0, // 返回成功，因为数据可能已是最新的
          msg: "用户信息无需更新",
        };
      }
    }

    // 更新成功，返回成功信息
    // 注意：不建议在这里返回 data，因为前端已有数据，避免数据覆盖问题
    return {
      code: 0,
      msg: "更新用户信息成功",
    };
  } catch (err) {
    console.error("更新用户信息失败", err);
    return {
      code: 1,
      msg: "更新用户信息失败: " + (err.message || "数据库操作异常"),
    };
  }
};
