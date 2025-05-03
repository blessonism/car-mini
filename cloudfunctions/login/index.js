// 云函数：login
const cloud = require("wx-server-sdk");

// 初始化云开发
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const userCollection = db.collection("users");

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const appid = wxContext.APPID;

  // 检查用户是否已存在
  try {
    // 查询用户信息
    const userResult = await userCollection
      .where({
        _openid: openid,
      })
      .get();

    let userData = null;

    if (userResult.data.length === 0) {
      // 用户不存在，创建新用户
      const { userInfo } = event;

      const newUser = {
        _openid: openid,
        createTime: db.serverDate(),
        updateTime: db.serverDate(),
        // 合并微信用户信息
        nickName: userInfo ? userInfo.nickName : "",
        avatarUrl: userInfo ? userInfo.avatarUrl : "",
        gender: userInfo ? userInfo.gender : 0,
        // 默认其他用户信息
        phone: "",
        name: "",
        // 会员相关信息
        memberLevel: "普通会员",
        balance: "0.00",
      };

      // 添加到数据库
      const result = await userCollection.add({
        data: newUser,
      });

      // 查询新创建的用户完整信息
      if (result._id) {
        const newUserData = await userCollection.doc(result._id).get();
        userData = newUserData.data;
      }
    } else {
      // 用户已存在，更新登录时间和基本信息
      const user = userResult.data[0];
      const { userInfo } = event;

      if (userInfo) {
        // 更新微信用户信息
        await userCollection.doc(user._id).update({
          data: {
            updateTime: db.serverDate(),
            nickName: userInfo.nickName,
            avatarUrl: userInfo.avatarUrl,
            gender: userInfo.gender,
          },
        });
      } else {
        // 仅更新登录时间
        await userCollection.doc(user._id).update({
          data: {
            updateTime: db.serverDate(),
          },
        });
      }

      // 查询最新的用户信息
      const updatedUserData = await userCollection.doc(user._id).get();
      userData = updatedUserData.data;
    }

    // 返回用户信息
    return {
      code: 0,
      msg: "登录成功",
      data: userData,
    };
  } catch (err) {
    console.error("登录发生错误", err);
    return {
      code: 1,
      msg: "登录失败: " + err.message,
      data: null,
    };
  }
};
