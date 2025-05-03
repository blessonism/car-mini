// 云函数入口文件
const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const userCollection = db.collection("users");

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  if (!openid) {
    return {
      code: 1,
      msg: "获取用户身份失败",
      data: null,
    };
  }

  try {
    // 查询用户信息
    const userResult = await userCollection
      .where({
        _openid: openid,
      })
      .get();

    if (userResult.data.length === 0) {
      return {
        code: 1,
        msg: "用户不存在",
        data: null,
      };
    }

    // 返回用户信息
    return {
      code: 0,
      msg: "获取用户信息成功",
      data: userResult.data[0],
    };
  } catch (err) {
    console.error("获取用户信息失败", err);
    return {
      code: 1,
      msg: "获取用户信息失败: " + err.message,
      data: null,
    };
  }
};
