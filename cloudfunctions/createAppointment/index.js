// 云函数入口文件
const cloud = require("wx-server-sdk");

cloud.init({
  env: "cloud1-0grrc4znc15e5fde",
});

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openId = wxContext.OPENID;

  const {
    userId,
    vehicleId,
    appointmentTime,
    serviceId,
    serviceType,
    duration,
    notes = "",
    contactPhone,
    isImmediate = false, // 新增参数，标识是否为立即服务
  } = event;

  // 增强的字段验证，列出所有缺少的字段
  const missingFields = [];
  if (!userId) missingFields.push("userId");
  if (!vehicleId) missingFields.push("vehicleId");
  if (!appointmentTime) missingFields.push("appointmentTime");
  if (!serviceId) missingFields.push("serviceId");
  if (!serviceType) missingFields.push("serviceType");
  if (!contactPhone) missingFields.push("contactPhone");

  if (missingFields.length > 0) {
    return {
      success: false,
      message: `缺少必要字段: ${missingFields.join(", ")}`,
    };
  }

  // 验证serviceType是否合法
  if (serviceType !== "immediate" && serviceType !== "appointment") {
    return {
      success: false,
      message:
        "服务类型不合法，必须为 immediate 或 appointment，当前值: " +
        serviceType,
    };
  }

  try {
    const now = new Date();
    const appointmentTimeDate = new Date(appointmentTime);

    // 检查预约时间是否合法（不能早于当前时间）
    // 但如果是立即服务，则跳过这个验证
    if (!isImmediate && appointmentTimeDate < now) {
      return {
        success: false,
        message: "预约时间不能早于当前时间",
      };
    }

    // 如果是立即服务，强制更新appointmentTimeDate为当前时间加10分钟
    if (serviceType === "immediate") {
      appointmentTimeDate.setTime(now.getTime());
      appointmentTimeDate.setMinutes(appointmentTimeDate.getMinutes() + 10);
    }

    // 创建预约
    const result = await db.collection("appointments").add({
      data: {
        _openid: openId,
        userId,
        vehicleId,
        createTime: now,
        updateTime: now,
        serviceType,
        appointmentTime: appointmentTimeDate,
        duration,
        serviceId,
        status: serviceType === "immediate" ? "进行中" : "待确认", // 立即服务直接设为进行中
        notes,
        contactPhone,
      },
    });

    return {
      success: true,
      data: {
        _id: result._id,
        appointmentTime: appointmentTimeDate,
      },
      message: "创建预约成功",
    };
  } catch (err) {
    return {
      success: false,
      message: "创建预约失败",
      error: err,
    };
  }
};
