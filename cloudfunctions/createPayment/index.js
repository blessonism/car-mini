// 云函数入口文件
const cloud = require("wx-server-sdk");

cloud.init({
  env: "cloud1-0grrc4znc15e5fde",
});

const db = cloud.database();

// 生成支付编号
function generatePaymentNo() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");

  return `PAY${year}${month}${day}${hours}${minutes}${seconds}${random}`;
}

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openId = wxContext.OPENID;

  const {
    userId,
    orderId,
    amount,
    paymentMethod,
    isAdmin = false,
    operatorId,
  } = event;

  // 验证必要字段
  if (!userId || !orderId || !amount || !paymentMethod) {
    return {
      success: false,
      message: "缺少必要字段",
    };
  }

  // 验证金额格式
  if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
    return {
      success: false,
      message: "支付金额格式不正确",
    };
  }

  try {
    // 查询订单信息
    const { data: order } = await db.collection("orders").doc(orderId).get();

    // 验证权限：只有订单创建者或管理员可以创建支付记录
    if (!isAdmin && order._openid !== openId) {
      return {
        success: false,
        message: "没有权限创建支付记录",
      };
    }

    // 检查订单状态
    if (order.status === "已取消") {
      return {
        success: false,
        message: "已取消的订单不能支付",
      };
    }

    // 检查支付金额是否合理
    const orderTotal = parseFloat(order.actualAmount);
    const amountPaid = parseFloat(amount);

    // 允许支付金额在一定范围内浮动，但不能明显小于订单金额
    // 1. 支付金额不能小于订单金额的95%
    // 2. 允许超额支付，但记录日志
    if (amountPaid < orderTotal * 0.95) {
      return {
        success: false,
        message: `支付金额(${amountPaid})过小，不能低于订单应付金额(${orderTotal})的95%`,
      };
    }

    // 记录超额支付
    if (amountPaid > orderTotal * 1.05) {
      console.log(
        `警告：订单超额支付：订单ID=${orderId}, 订单金额=${orderTotal}, 实付金额=${amountPaid}`
      );
    }

    const now = new Date();
    const paymentNo = generatePaymentNo();

    // 创建支付记录
    const { _id: paymentId } = await db.collection("payments").add({
      data: {
        _openid: openId,
        userId,
        orderId,
        createTime: now,
        updateTime: now,
        paymentNo,
        amount,
        paymentMethod,
        paymentTime: now, // 假设支付立即成功
        status: "成功",
        operatorId: operatorId || null,
        transactionId: `wx_${Date.now()}`, // 模拟交易ID
      },
    });

    // 更新订单支付状态
    const updateData = {
      paymentStatus: "已支付",
      updateTime: now,
    };

    // 更新订单业务状态
    if (order.status === "待支付" || !order.status) {
      // 如果订单当前是待支付或没有状态，则更新为已支付
      updateData.status = "已支付";
    } else if (order.status === "已取消") {
      // 如果订单已取消但又支付了，记录警告
      console.log("警告：已取消的订单收到了支付，订单ID:", orderId);
      // 可以选择发送通知给管理员
    }
    // 其他状态（服务中、已完成）则维持原状态，不更新

    await db.collection("orders").doc(orderId).update({
      data: updateData,
    });

    return {
      success: true,
      data: {
        paymentId,
        paymentNo,
        paymentStatus: "已支付",
      },
      message: "创建支付记录成功",
    };
  } catch (err) {
    return {
      success: false,
      message: "创建支付记录失败",
      error: err,
    };
  }
};
