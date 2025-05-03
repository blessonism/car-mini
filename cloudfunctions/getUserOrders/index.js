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

  const { status, paymentStatus } = event;

  try {
    // 构建查询条件
    const condition = {
      _openid: openId,
    };

    // 如果指定了订单状态，则按状态筛选
    if (status) {
      condition.status = status;
    }

    // 如果指定了支付状态，则按支付状态筛选
    if (paymentStatus) {
      condition.paymentStatus = paymentStatus;
    }

    // 查询订单列表，按创建时间降序排列
    const { data: orders } = await db
      .collection("orders")
      .where(condition)
      .orderBy("createTime", "desc")
      .get();

    // 获取关联的车辆信息
    const vehicleIds = [...new Set(orders.map((item) => item.vehicleId))];
    const { data: vehicles } = await db
      .collection("vehicles")
      .where({
        _id: _.in(vehicleIds),
      })
      .get();

    // 获取关联的服务信息
    let serviceIds = [];
    orders.forEach((order) => {
      if (order.orderItems && order.orderItems.length > 0) {
        const serviceItems = order.orderItems.filter(
          (item) => item.itemType === "service"
        );
        serviceIds = serviceIds.concat(serviceItems.map((item) => item.itemId));
      }
    });

    const uniqueServiceIds = [...new Set(serviceIds)];
    let services = [];

    if (uniqueServiceIds.length > 0) {
      const { data } = await db
        .collection("services")
        .where({
          _id: _.in(uniqueServiceIds),
        })
        .get();
      services = data;
    }

    // 将车辆信息合并到订单数据中
    const vehicleMap = {};
    vehicles.forEach((vehicle) => {
      vehicleMap[vehicle._id] = vehicle;
    });

    const serviceMap = {};
    services.forEach((service) => {
      serviceMap[service._id] = service;
    });

    const result = orders.map((order) => {
      const orderData = { ...order };

      // 添加车辆信息
      if (vehicleMap[order.vehicleId]) {
        orderData.vehicle = vehicleMap[order.vehicleId];
      }

      // 获取支付记录
      // 注意：这里仅标记需要查询支付记录，实际数据会在后续查询
      orderData.needPayments = true;

      return orderData;
    });

    // 批量获取订单的支付记录
    const orderIds = orders.map((order) => order._id);
    const { data: payments } = await db
      .collection("payments")
      .where({
        orderId: _.in(orderIds),
      })
      .get();

    // 构建支付记录映射
    const paymentMap = {};
    payments.forEach((payment) => {
      if (!paymentMap[payment.orderId]) {
        paymentMap[payment.orderId] = [];
      }
      paymentMap[payment.orderId].push(payment);
    });

    // 将支付记录添加到订单数据中
    const finalResult = result.map((order) => {
      order.payments = paymentMap[order._id] || [];
      delete order.needPayments;
      return order;
    });

    return {
      success: true,
      data: finalResult,
      message: "获取订单列表成功",
    };
  } catch (err) {
    return {
      success: false,
      message: "获取订单列表失败",
      error: err,
    };
  }
};
