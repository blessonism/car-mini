// 云函数入口文件
const cloud = require("wx-server-sdk");

cloud.init({
  env: "cloud1-0grrc4znc15e5fde",
});

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const { orderId, status, isAdmin = false } = event;

  // 验证必要字段
  if (!orderId || !status) {
    return {
      success: false,
      message: "缺少必要字段",
    };
  }

  // 验证状态是否合法
  const validStatus = ["待支付", "已支付", "服务中", "已完成", "已取消"];
  if (!validStatus.includes(status)) {
    return {
      success: false,
      message: "状态值不合法",
    };
  }

  try {
    const wxContext = cloud.getWXContext();
    const openId = wxContext.OPENID;

    // 查询订单信息
    const { data: order } = await db.collection("orders").doc(orderId).get();

    // 验证权限：只有订单创建者或管理员可以更新状态
    if (!isAdmin && order._openid !== openId) {
      return {
        success: false,
        message: "没有权限更新此订单",
      };
    }

    // 普通用户只能取消未支付的订单
    if (!isAdmin && order._openid === openId) {
      if (status === "已取消" && order.status !== "待支付") {
        return {
          success: false,
          message: "只能取消未支付的订单",
        };
      }

      if (status !== "已取消") {
        return {
          success: false,
          message: "普通用户只能取消订单",
        };
      }
    }

    // 已完成或已取消的订单不能再变更状态
    if (order.status === "已完成" || order.status === "已取消") {
      return {
        success: false,
        message: "已完成或已取消的订单不能再变更状态",
      };
    }

    // 特殊状态检查
    if (status === "已支付" && order.paymentStatus !== "已支付") {
      return {
        success: false,
        message: "只有已完成支付的订单才能标记为已支付状态",
      };
    }

    const updateData = {
      status,
      updateTime: new Date(),
    };

    // 如果订单完成，记录完成时间
    if (status === "已完成") {
      updateData.completionTime = new Date();
    }

    // 更新订单状态
    await db.collection("orders").doc(orderId).update({
      data: updateData,
    });

    // 如果订单关联了预约，且订单标记为已完成，同时更新预约状态为已完成
    if (status === "已完成" && order.appointmentId) {
      await db
        .collection("appointments")
        .doc(order.appointmentId)
        .update({
          data: {
            status: "已完成",
            updateTime: new Date(),
          },
        });
    }

    // 如果订单被取消，且订单关联了预约，同时更新预约状态为已取消
    if (status === "已取消" && order.appointmentId) {
      await db
        .collection("appointments")
        .doc(order.appointmentId)
        .update({
          data: {
            status: "已取消",
            updateTime: new Date(),
          },
        });
    }

    return {
      success: true,
      message: "更新订单状态成功",
    };
  } catch (err) {
    return {
      success: false,
      message: "更新订单状态失败",
      error: err,
    };
  }
};
