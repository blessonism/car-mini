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
      msg: "未获取到用户身份",
    };
  }

  try {
    const { userInfo } = event;

    // 确保数据存在
    if (!userInfo) {
      return {
        code: 1,
        msg: "未提供用户信息",
      };
    }

    // 查询用户是否存在
    const userResult = await userCollection
      .where({
        _openid: openid,
      })
      .get();

    if (userResult.data.length === 0) {
      // 用户不存在，创建新用户
      const newUser = {
        _openid: openid,
        ...userInfo,
        createTime: db.serverDate(),
        updateTime: db.serverDate(),
      };

      await userCollection.add({
        data: newUser,
      });

      return {
        code: 0,
        msg: "创建用户成功",
        data: newUser,
      };
    } else {
      // 用户存在，更新用户信息
      const user = userResult.data[0];
      await userCollection.doc(user._id).update({
        data: {
          ...userInfo,
          updateTime: db.serverDate(),
        },
      });

      // 返回更新后的用户信息
      return {
        code: 0,
        msg: "更新用户信息成功",
        data: {
          ...user,
          ...userInfo,
        },
      };
    }
  } catch (err) {
    console.error("更新用户信息失败", err);
    return {
      code: 1,
      msg: "更新用户信息失败: " + err.message,
    };
  }
};
