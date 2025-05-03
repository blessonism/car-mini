// 云函数入口文件
const cloud = require("wx-server-sdk");

cloud.init({
  env: "cloud1-0grrc4znc15e5fde",
});

const db = cloud.database();

// 确保集合存在
async function ensureCollectionExists(collectionName) {
  try {
    // 尝试获取集合的记录，如果不存在会抛出异常
    await db.collection(collectionName).limit(1).get();
    return true;
  } catch (err) {
    if (
      err.errCode === -502005 ||
      err.message.includes("collection not exists")
    ) {
      // 集合不存在，我们不能直接创建集合，改为使用另一种机制
      return false;
    }
    throw err; // 其他错误则抛出
  }
}

// 回退到使用时间戳作为序列号的老方法
function generateOrderNoFallback() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  // 使用时间戳毫秒部分作为序列号
  const sequence = String(now.getTime() % 10000).padStart(4, "0");

  return `CS${year}${month}${day}${sequence}`;
}

// 生成订单编号
async function generateOrderNo() {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const dateString = `${year}${month}${day}`;

    // 检查counters集合是否存在
    const collectionExists = await ensureCollectionExists("counters");

    if (!collectionExists) {
      // 如果集合不存在，使用回退方法
      console.warn("counters集合不存在，使用时间戳作为订单序列号");
      return generateOrderNoFallback();
    }

    // 获取或创建当天的计数器
    let counterDoc;
    try {
      // 尝试获取当天的计数器
      const result = await db
        .collection("counters")
        .doc(`orderCounter_${dateString}`)
        .get();
      counterDoc = result.data;
    } catch (err) {
      // 计数器不存在，创建一个新的
      try {
        await db.collection("counters").add({
          data: {
            _id: `orderCounter_${dateString}`,
            count: 0,
            date: dateString,
            updateTime: now,
          },
        });
        counterDoc = { count: 0 };
      } catch (addErr) {
        // 如果添加记录也失败了，使用回退方法
        console.error("创建计数器失败:", addErr);
        return generateOrderNoFallback();
      }
    }

    // 递增计数器
    let newCount;
    try {
      const newCount = counterDoc.count + 1;
      await db
        .collection("counters")
        .doc(`orderCounter_${dateString}`)
        .update({
          data: {
            count: newCount,
            updateTime: now,
          },
        });

      // 格式化为4位数，前导零填充
      const sequence = String(newCount).padStart(4, "0");

      return `CS${dateString}${sequence}`;
    } catch (updateErr) {
      // 如果更新计数器失败，使用回退方法
      console.error("更新计数器失败:", updateErr);
      return generateOrderNoFallback();
    }
  } catch (err) {
    // 任何未预期的错误，都使用回退方法
    console.error("生成订单号时发生错误:", err);
    return generateOrderNoFallback();
  }
}

// 云函数入口函数
exports.main = async (event, context) => {
  const { appointmentId, isAdmin = false, storeId = "default_store" } = event;

  // 验证必要字段
  if (!appointmentId) {
    return {
      success: false,
      message: "缺少必要字段: appointmentId",
    };
  }

  try {
    const wxContext = cloud.getWXContext();
    const openId = wxContext.OPENID;

    // 查询预约信息
    let appointment;
    try {
      const result = await db
        .collection("appointments")
        .doc(appointmentId)
        .get();
      appointment = result.data;

      if (!appointment) {
        return {
          success: false,
          message: `未找到ID为 ${appointmentId} 的预约记录`,
        };
      }

      // 日志记录预约信息关键字段
      console.log("预约信息:", {
        appointmentId: appointment._id,
        userId: appointment.userId,
        openId: appointment._openid,
        vehicleId: appointment.vehicleId,
        serviceType: appointment.serviceType,
        status: appointment.status,
      });
    } catch (err) {
      return {
        success: false,
        message: `获取预约信息失败: ${err.message}`,
        error: err,
      };
    }

    // 验证权限：只有管理员可以从预约创建订单
    if (!isAdmin) {
      return {
        success: false,
        message: "没有权限创建订单，需要管理员权限(isAdmin=true)",
      };
    }

    // 检查预约状态是否为已确认或进行中或待确认
    const isImmediateService = appointment.serviceType === "immediate";
    const validStatus = ["已确认", "进行中", "待确认"];

    if (!validStatus.includes(appointment.status)) {
      return {
        success: false,
        message: `只有已确认、进行中或待确认的预约才能创建订单，当前预约状态: ${appointment.status}`,
      };
    }

    // 检查预约是否已经关联了订单
    if (appointment.orderId) {
      return {
        success: false,
        message: `该预约已经创建过订单，关联的订单ID: ${appointment.orderId}`,
      };
    }

    // 获取预约中的服务项目详情
    let service;
    try {
      const result = await db
        .collection("services")
        .doc(appointment.serviceId)
        .get();
      service = result.data;

      if (!service) {
        return {
          success: false,
          message: `未找到关联的服务项目，服务ID: ${appointment.serviceId}`,
        };
      }
    } catch (err) {
      return {
        success: false,
        message: `获取服务信息失败: ${err.message}`,
        error: err,
      };
    }

    // 计算订单总金额
    const totalAmount = service.price;

    // 构建orderItems数组
    const orderItems = [
      {
        itemId: service._id,
        itemType: "service",
        name: service.name,
        unitPrice: service.price,
        quantity: 1,
        amount: service.price,
      },
    ];

    const now = new Date();
    const orderNo = await generateOrderNo();

    // 如果预约没有联系电话，尝试从用户信息获取
    let contactPhone = appointment.contactPhone;
    if (!contactPhone) {
      try {
        const userResult = await db
          .collection("users")
          .where({
            _openid: appointment._openid,
          })
          .get();

        if (userResult.data.length > 0) {
          const userInfo = userResult.data[0];
          contactPhone = userInfo.phoneNumber || "";
        }
      } catch (err) {
        console.log("获取用户电话失败，但将继续创建订单:", err);
      }
    }

    // 创建订单
    const { _id: orderId } = await db.collection("orders").add({
      data: {
        _openid: appointment._openid,
        userId: appointment.userId || openId, // 如果没有userId，使用openId作为替代
        createTime: now,
        updateTime: now,
        orderNo,
        appointmentId,
        vehicleId: appointment.vehicleId,
        orderItems,
        totalAmount,
        discountAmount: "0.00", // 初始没有优惠
        actualAmount: totalAmount, // 初始实付金额等于总金额
        status: "待支付",
        paymentStatus: "未支付",
        storeId, // 使用传入的storeId或默认值
        contactPhone: contactPhone || "",
        notes: appointment.notes,
      },
    });

    console.log("创建订单时使用的userId:", appointment.userId || openId);

    // 如果预约状态是待确认，自动更新为进行中
    if (appointment.status === "待确认") {
      await db
        .collection("appointments")
        .doc(appointmentId)
        .update({
          data: {
            status: "进行中",
            orderId,
            updateTime: now,
          },
        });
    } else {
      // 正常更新预约，关联订单ID
      await db
        .collection("appointments")
        .doc(appointmentId)
        .update({
          data: {
            orderId,
            updateTime: now,
          },
        });
    }

    return {
      success: true,
      data: {
        orderId,
        orderNo,
      },
      message: "创建订单成功",
    };
  } catch (err) {
    return {
      success: false,
      message: `创建订单失败: ${err.message}`,
      error: err,
    };
  }
};
