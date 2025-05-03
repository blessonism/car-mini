// 云函数：getPhoneNumber
const cloud = require("wx-server-sdk");

// 初始化云函数
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();
const userCollection = db.collection("users");

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  // 验证参数
  if (!event.code) {
    return {
      code: 1,
      msg: "缺少参数code",
      data: null,
    };
  }

  try {
    // 解析手机号
    const result = await cloud.openapi.phonenumber.getPhoneNumber({
      code: event.code,
    });

    if (result && result.phoneInfo && result.phoneInfo.phoneNumber) {
      const phoneNumber = result.phoneInfo.phoneNumber;

      // 更新用户手机号
      const userResult = await userCollection
        .where({
          _openid: openid,
        })
        .get();

      if (userResult.data.length > 0) {
        const userId = userResult.data[0]._id;
        await userCollection.doc(userId).update({
          data: {
            phone: phoneNumber,
            updateTime: db.serverDate(),
          },
        });
      }

      return {
        code: 0,
        msg: "获取手机号成功",
        data: {
          phoneNumber,
        },
      };
    }

    return {
      code: 1,
      msg: "获取手机号失败",
      data: null,
    };
  } catch (err) {
    console.error("获取手机号失败", err);
    return {
      code: 1,
      msg: "获取手机号失败: " + err.message,
      data: null,
    };
  }
};
