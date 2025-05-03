// 云函数入口文件
const cloud = require("wx-server-sdk");

cloud.init({
  env: "cloud1-0grrc4znc15e5fde",
});

const db = cloud.database();
const _ = db.command;

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openId = wxContext.OPENID;

  const { status } = event;

  try {
    // 构建查询条件
    const condition = {
      _openid: openId,
    };

    // 如果指定了状态，则按状态筛选
    if (status) {
      condition.status = status;
    }

    // 查询预约列表，按预约时间降序排列
    const { data: appointments } = await db
      .collection("appointments")
      .where(condition)
      .orderBy("appointmentTime", "desc")
      .get();

    // 获取关联的车辆信息
    const vehicleIds = [...new Set(appointments.map((item) => item.vehicleId))];
    const { data: vehicles } = await db
      .collection("vehicles")
      .where({
        _id: _.in(vehicleIds),
      })
      .get();

    // 获取关联的服务信息
    const serviceIds = appointments
      .map((appointment) => appointment.serviceId)
      .filter(Boolean);

    const uniqueServiceIds = [...new Set(serviceIds)];
    const { data: services } = await db
      .collection("services")
      .where({
        _id: _.in(uniqueServiceIds),
      })
      .get();

    // 将车辆和服务信息合并到预约数据中
    const vehicleMap = {};
    vehicles.forEach((vehicle) => {
      vehicleMap[vehicle._id] = vehicle;
    });

    const serviceMap = {};
    services.forEach((service) => {
      serviceMap[service._id] = service;
    });

    const result = appointments.map((appointment) => {
      const appointmentData = { ...appointment };

      // 添加车辆信息
      if (vehicleMap[appointment.vehicleId]) {
        appointmentData.vehicle = vehicleMap[appointment.vehicleId];
      }

      // 添加服务信息
      if (appointment.serviceId) {
        appointmentData.service = serviceMap[appointment.serviceId];
      }

      return appointmentData;
    });

    return {
      success: true,
      data: result,
      message: "获取预约列表成功",
    };
  } catch (err) {
    return {
      success: false,
      message: "获取预约列表失败",
      error: err,
    };
  }
};
