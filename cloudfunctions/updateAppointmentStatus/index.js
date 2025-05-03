// 云函数入口文件
const cloud = require("wx-server-sdk");

cloud.init({
  env: "cloud1-0grrc4znc15e5fde",
});

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const { appointmentId, status, isAdmin = false, vehicleId, notes } = event;

  // 验证必要字段
  if (!appointmentId) {
    return {
      success: false,
      message: "缺少必要字段appointmentId",
    };
  }

  try {
    const wxContext = cloud.getWXContext();
    const openId = wxContext.OPENID;

    // 查询预约信息
    const { data: appointment } = await db
      .collection("appointments")
      .doc(appointmentId)
      .get();

    if (!appointment) {
      return {
        success: false,
        message: "预约不存在",
      };
    }

    // 验证权限：只有预约创建者或管理员可以更新状态
    if (!isAdmin && appointment._openid !== openId) {
      return {
        success: false,
        message: "没有权限更新此预约",
      };
    }

    // 非管理员用户只能取消自己的预约或更新备注和车辆信息，不能更改为其他状态
    if (
      !isAdmin &&
      appointment._openid === openId &&
      status &&
      status !== "已取消"
    ) {
      return {
        success: false,
        message: "普通用户只能取消预约或更新车辆和备注信息",
      };
    }

    // 构建更新数据对象
    const updateData = {
      updateTime: new Date(),
    };

    // 只有在提供状态时才更新状态
    if (status) {
      // 验证状态是否合法
      const validStatus = ["待确认", "已确认", "进行中", "已完成", "已取消"];
      if (!validStatus.includes(status)) {
        return {
          success: false,
          message: "状态值不合法",
        };
      }
      updateData.status = status;
    }

    // 更新车辆ID
    if (vehicleId) {
      updateData.vehicleId = vehicleId;
    }

    // 更新备注信息
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    // 更新预约
    await db.collection("appointments").doc(appointmentId).update({
      data: updateData,
    });

    return {
      success: true,
      message: "更新预约信息成功",
      data: {
        appointmentId,
        updatedFields: Object.keys(updateData).filter(
          (key) => key !== "updateTime"
        ),
      },
    };
  } catch (err) {
    return {
      success: false,
      message: "更新预约信息失败",
      error: err,
    };
  }
};
