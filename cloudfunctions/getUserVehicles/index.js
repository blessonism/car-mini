// 云函数入口文件
const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const vehiclesCollection = db.collection("vehicles");

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
    // 查询该用户的所有车辆
    // 使用_openid字段查询可以利用数据库索引提高查询效率
    // 同时符合微信云开发的权限控制机制
    const vehicles = await vehiclesCollection
      .where({
        _openid: openid,
      })
      .orderBy("createTime", "desc")
      .get();

    return {
      code: 0,
      msg: "获取车辆信息成功",
      data: {
        vehicles: vehicles.data,
      },
    };
  } catch (err) {
    console.error("获取车辆信息失败", err);
    return {
      code: 1,
      msg: "获取车辆信息失败: " + err.message,
      data: null,
    };
  }
};
