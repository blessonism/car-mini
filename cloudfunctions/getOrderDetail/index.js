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

  const { orderId } = event;

  // 验证必要字段
  if (!orderId) {
    return {
      success: false,
      message: "缺少必要字段: orderId",
    };
  }

  try {
    // 获取订单信息
    const { data: order } = await db.collection("orders").doc(orderId).get();

    if (!order) {
      return {
        success: false,
        message: "订单不存在",
      };
    }

    // 验证权限：只能查看自己的订单，管理员除外
    const isAdmin = event.isAdmin || false;
    if (order._openid !== openId && !isAdmin) {
      return {
        success: false,
        message: "无权查看此订单",
      };
    }

    // 获取订单关联的预约信息
    let appointment = null;
    if (order.appointmentId) {
      try {
        const { data } = await db
          .collection("appointments")
          .doc(order.appointmentId)
          .get();
        appointment = data;
      } catch (err) {
        console.log("获取预约信息失败", err);
      }
    }

    // 获取订单关联的车辆信息
    let vehicle = null;
    if (order.vehicleId) {
      try {
        const { data } = await db
          .collection("vehicles")
          .doc(order.vehicleId)
          .get();
        vehicle = data;
      } catch (err) {
        console.log("获取车辆信息失败", err);
      }
    }

    // 获取订单关联的支付记录
    const { data: payments } = await db
      .collection("payments")
      .where({
        orderId: orderId,
      })
      .get();

    // 获取订单关联的服务信息
    let serviceMap = {};
    if (order.orderItems && order.orderItems.length > 0) {
      const serviceIds = order.orderItems
        .filter((item) => item.itemType === "service")
        .map((item) => item.itemId);

      if (serviceIds.length > 0) {
        const { data: services } = await db
          .collection("services")
          .where({
            _id: _.in(serviceIds),
          })
          .get();

        services.forEach((service) => {
          serviceMap[service._id] = service;
        });
      }
    }

    // 构建订单状态时间线
    const timeline = [];

    // 添加创建订单步骤
    timeline.push({
      title: "订单已提交",
      time: formatTime(order.createTime),
      status: "finish",
    });

    // 添加支付步骤
    if (order.paymentStatus === "已支付") {
      const payment = payments.length > 0 ? payments[0] : null;
      timeline.push({
        title: "支付完成",
        time: payment
          ? formatTime(payment.createTime)
          : formatTime(order.updateTime),
        status: "finish",
      });
    } else if (order.paymentStatus === "未支付") {
      timeline.push({
        title: "等待支付",
        time: "待支付",
        status: "process",
      });
    }

    // 添加服务步骤
    if (order.status === "服务中") {
      timeline.push({
        title: "服务进行中",
        time: appointment ? formatTime(appointment.appointmentTime) : "当前",
        status: "process",
      });
      timeline.push({
        title: "服务完成",
        time: "进行中",
        status: "wait",
      });
    } else if (order.status === "已完成") {
      timeline.push({
        title: "服务进行中",
        time: appointment ? formatTime(appointment.appointmentTime) : "",
        status: "finish",
      });
      timeline.push({
        title: "服务完成",
        time: formatTime(order.updateTime),
        status: "finish",
      });
    } else if (order.status === "已取消") {
      timeline.push({
        title: "订单已取消",
        time: formatTime(order.updateTime),
        status: "finish",
      });
    }

    // 构建结果对象
    const result = {
      ...order,
      carInfo: vehicle || {
        plate: "未知车牌",
        brand: "未知品牌",
        model: "未知型号",
      },
      appointment: appointment,
      payments: payments,
      steps: timeline,
      statusText: getStatusText(order.status),
      statusDesc: getStatusDesc(order.status, appointment),
    };

    return {
      success: true,
      data: result,
      message: "获取订单详情成功",
    };
  } catch (err) {
    return {
      success: false,
      message: "获取订单详情失败",
      error: err,
    };
  }
};

// 格式化时间
function formatTime(timestamp) {
  if (!timestamp) return "";

  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `${year}年${month}月${day}日 ${hour}:${minute}`;
}

// 获取状态文本
function getStatusText(status) {
  switch (status) {
    case "待支付":
      return "待支付";
    case "已支付":
      return "待服务";
    case "服务中":
      return "服务中";
    case "已完成":
      return "已完成";
    case "已取消":
      return "已取消";
    default:
      return "未知状态";
  }
}

// 获取状态描述
function getStatusDesc(status, appointment) {
  switch (status) {
    case "待支付":
      return "请尽快完成支付";
    case "已支付":
      if (appointment) {
        const appointmentTime = new Date(appointment.appointmentTime);
        const now = new Date();
        if (appointmentTime > now) {
          return `预约时间：${formatTime(appointment.appointmentTime)}`;
        } else {
          return "等待门店服务";
        }
      }
      return "等待门店服务";
    case "服务中":
      return "正在为您提供服务";
    case "已完成":
      return "服务已完成，感谢您的信任";
    case "已取消":
      return "订单已取消";
    default:
      return "";
  }
}
