// order-detail.js
Page({
  data: {
    orderInfo: {
      id: "OD202307150001",
      orderNo: "WXC2023081811001",
      status: "processing", // pending, processing, completed, cancelled
      statusText: "服务中",
      statusDesc: "正在门店接受服务",
      createTime: "2023-07-15 15:30",
      appointmentTime: "2023年8月18日 11:00",
      storeName: "车店智能养护中心(总店)",
      storeAddress: "广州市天河区天河路385号",
      contactPhone: "138****5678",
      amount: 149.1,
      discount: 0,
      totalAmount: 149.1,
      technician: "李师傅",
      paymentMethod: "微信支付",
      carInfo: {
        plate: "粤B12345",
        brand: "奔驰",
        model: "C260L",
        color: "黑色",
      },
      services: [
        {
          id: 1,
          name: "豪华洗车套餐",
          description: "",
          price: 149.1,
        },
      ],
      remark: "请注意车内座椅的清洁",
      steps: [
        {
          title: "订单已提交",
          time: "8月18日 09:30",
          status: "finish",
        },
        {
          title: "订单已确认",
          time: "8月18日 09:35",
          status: "finish",
        },
        {
          title: "服务进行中",
          time: "8月18日 11:05 (当前)",
          status: "process",
        },
        {
          title: "服务已完成",
          time: "待完成",
          status: "wait",
        },
        {
          title: "客户已确认",
          time: "待客户确认",
          status: "wait",
        },
      ],
      customer: {
        name: "张先生",
      },
    },
    currentStep: 2, // 当前进行到第3步（服务进行中）
  },

  onLoad: function (options) {
    // 如果传入了订单ID，则获取订单详情
    if (options.id) {
      this.loadOrderDetail(options.id);
    }

    // 根据状态设置不同的状态文本和描述
    this.updateStatusText();
  },

  onShow: function () {
    // 获取 TabBar 实例
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 2, // 设置选中的 TabBar 项为"订单"选项卡
      });
    }
  },

  // 更新订单状态文本和描述
  updateStatusText: function () {
    let statusText = "";
    let statusDesc = "";

    switch (this.data.orderInfo.status) {
      case "pending":
        statusText = "待服务";
        statusDesc = "预约成功，等待门店服务";
        break;
      case "processing":
        statusText = "服务中";
        statusDesc = "正在门店接受服务";
        break;
      case "completed":
        statusText = "已完成";
        statusDesc = "服务已完成，感谢您的信任";
        break;
      case "cancelled":
        statusText = "已取消";
        statusDesc = "订单已取消";
        break;
      default:
        statusText = "未知状态";
        statusDesc = "订单状态未知";
    }

    this.setData({
      "orderInfo.statusText": statusText,
      "orderInfo.statusDesc": statusDesc,
    });
  },

  // 加载订单详情
  loadOrderDetail: function (orderId) {
    // 从数据库获取真实订单数据
    wx.showLoading({
      title: "加载中...",
    });

    // 使用小程序数据库直接获取数据
    const db = wx.cloud.database();

    // 先获取订单基本信息
    db.collection("orders")
      .doc(orderId)
      .get()
      .then((res) => {
        const orderData = res.data;
        if (!orderData) {
          wx.hideLoading();
          wx.showToast({
            title: "订单不存在",
            icon: "none",
          });
          return Promise.reject("订单不存在");
        }

        // 获取关联的车辆信息
        let vehiclePromise = Promise.resolve(null);
        if (orderData.vehicleId) {
          vehiclePromise = db
            .collection("vehicles")
            .doc(orderData.vehicleId)
            .get()
            .then((res) => res.data)
            .catch(() => null);
        }

        // 获取关联的预约信息
        let appointmentPromise = Promise.resolve(null);
        if (orderData.appointmentId) {
          appointmentPromise = db
            .collection("appointments")
            .doc(orderData.appointmentId)
            .get()
            .then((res) => res.data)
            .catch(() => null);
        }

        // 获取用户信息
        let userPromise = Promise.resolve(null);
        if (orderData.userId) {
          userPromise = db
            .collection("users")
            .where({ _id: orderData.userId })
            .get()
            .then((res) =>
              res.data && res.data.length > 0 ? res.data[0] : null
            )
            .catch(() => null);
        }

        // 并行获取所有关联数据
        return Promise.all([
          Promise.resolve(orderData),
          vehiclePromise,
          appointmentPromise,
          userPromise,
        ]);
      })
      .then(([orderData, vehicle, appointment, user]) => {
        wx.hideLoading();

        if (!orderData) return;

        // 构建完整的时间线数据
        const timeline = this.buildFullTimeline(orderData, appointment);

        // 状态映射
        const statusMap = {
          待支付: "pending",
          已支付: "pending",
          服务中: "processing",
          已完成: "completed",
          已取消: "cancelled",
        };

        // 构建格式化的订单数据
        const formattedOrder = {
          id: orderData._id,
          orderNo:
            orderData.orderNo ||
            `CS${this.formatDateForOrderNo(orderData.createTime)}`, // 优先使用数据库中的orderNo字段
          status: statusMap[orderData.status] || "pending",
          statusText: null, // 会通过updateStatusText更新
          statusDesc: null, // 会通过updateStatusText更新
          createTime: this.formatTime(orderData.createTime),
          appointmentTime: this.getFormattedAppointmentTime(
            orderData,
            appointment
          ),
          storeName: orderData.storeName || "车店智能养护中心(总店)",
          storeAddress: orderData.storeAddress || "广州市天河区天河路385号",
          contactPhone: orderData.contactPhone || "138****5678",
          amount: orderData.totalAmount || 0,
          discount: orderData.discountAmount || 0,
          totalAmount: orderData.actualAmount || 0,
          technician: orderData.technician || null,
          paymentMethod: orderData.paymentMethod || "微信支付",
          carInfo: vehicle
            ? {
                plate: vehicle.plate || "未知车牌",
                brand: vehicle.brand || "未知品牌",
                model: vehicle.model || "未知型号",
                color: vehicle.color || "未知颜色",
              }
            : {
                plate: "未知车牌",
                brand: "未知品牌",
                model: "未知型号",
                color: "未知颜色",
              },
          services: orderData.orderItems
            ? orderData.orderItems.map((item) => ({
                id: item.itemId,
                name: item.name,
                description: "",
                price: item.unitPrice,
              }))
            : [
                {
                  id: null,
                  name: "未知服务",
                  description: "",
                  price: orderData.totalAmount || 0,
                },
              ],
          remark: orderData.notes || "",
          steps: timeline,
          customer: {
            // 使用用户信息作为客户姓名
            name: user ? user.name || user.nickName || "顾客" : "顾客",
          },
        };

        // 找到当前处理中的步骤
        const currentStepIndex = timeline.findIndex(
          (step) => step.status === "process"
        );

        // 更新数据
        this.setData({
          orderInfo: formattedOrder,
          currentStep: currentStepIndex !== -1 ? currentStepIndex : 0,
        });

        // 更新状态文本
        this.updateStatusText();
      })
      .catch((err) => {
        console.error("获取订单详情失败:", err);
        wx.hideLoading();
        // 在出错时不显示错误，而是使用默认数据
      });
  },

  // 构建完整的时间线数据
  buildFullTimeline: function (orderData, appointment) {
    const timeline = [];

    // 添加订单创建步骤
    timeline.push({
      title: "订单已提交",
      time: this.formatTime(orderData.createTime),
      status: "finish",
    });

    // 根据订单状态添加后续步骤
    if (orderData.status === "待支付") {
      timeline.push({
        title: "等待支付",
        time: "待支付",
        status: "process",
      });
      timeline.push({
        title: "服务进行中",
        time: "待服务",
        status: "wait",
      });
      timeline.push({
        title: "服务已完成",
        time: "待完成",
        status: "wait",
      });
    } else if (orderData.status === "已支付") {
      // 支付已完成，但服务未开始
      timeline.push({
        title: "支付完成",
        time: this.formatTime(orderData.updateTime),
        status: "finish",
      });

      // 确定预约时间
      let appointmentTimeStr = this.getFormattedAppointmentTime(
        orderData,
        appointment
      );

      timeline.push({
        title: "等待服务",
        time: `预约时间: ${appointmentTimeStr}`,
        status: "process",
      });
      timeline.push({
        title: "服务已完成",
        time: "待完成",
        status: "wait",
      });
    } else if (orderData.status === "服务中") {
      // 支付已完成，服务进行中
      timeline.push({
        title: "支付完成",
        time: this.formatTime(orderData.updateTime),
        status: "finish",
      });

      let serviceStartTime = this.getFormattedAppointmentTime(
        orderData,
        appointment
      );
      if (serviceStartTime === "未设置预约时间") {
        serviceStartTime = "服务进行中";
      }

      timeline.push({
        title: "服务进行中",
        time: serviceStartTime,
        status: "process",
      });

      timeline.push({
        title: "服务已完成",
        time: "待完成",
        status: "wait",
      });
    } else if (orderData.status === "已完成") {
      // 订单全部完成
      timeline.push({
        title: "支付完成",
        time: this.formatTime(orderData.updateTime),
        status: "finish",
      });

      let serviceStartTime = this.getFormattedAppointmentTime(
        orderData,
        appointment
      );
      if (
        serviceStartTime === "未设置预约时间" ||
        serviceStartTime === "已完成服务"
      ) {
        serviceStartTime = "已完成";
      }

      timeline.push({
        title: "服务进行中",
        time: serviceStartTime,
        status: "finish",
      });
      timeline.push({
        title: "服务已完成",
        time: this.formatTime(orderData.updateTime),
        status: "finish",
      });
    } else if (orderData.status === "已取消") {
      // 订单已取消
      timeline.push({
        title: "订单已取消",
        time: this.formatTime(orderData.updateTime),
        status: "finish",
      });
    }

    return timeline;
  },

  // 格式化时间
  formatTime: function (timestamp) {
    if (!timestamp) return "未指定时间";

    let date;
    try {
      // 尝试将timestamp转换为日期对象
      if (typeof timestamp === "string") {
        // 兼容字符串格式的日期
        date = new Date(timestamp);
      } else if (timestamp instanceof Date) {
        date = timestamp;
      } else if (typeof timestamp === "object" && timestamp._seconds) {
        // Firestore Timestamp对象
        date = new Date(timestamp._seconds * 1000);
      } else {
        // 尝试作为数字毫秒数
        date = new Date(Number(timestamp));
      }

      // 检查日期是否有效
      if (isNaN(date.getTime())) {
        return "未知时间";
      }

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hour = String(date.getHours()).padStart(2, "0");
      const minute = String(date.getMinutes()).padStart(2, "0");

      return `${year}-${month}-${day} ${hour}:${minute}`;
    } catch (e) {
      console.error("时间格式化错误:", e, timestamp);
      return "时间格式错误";
    }
  },

  // 取消预约
  cancelOrder: function () {
    wx.showModal({
      title: "取消预约",
      content: "确定要取消该预约吗？",
      success: (res) => {
        if (res.confirm) {
          // 实际项目中应该调用服务器API进行取消操作
          wx.showLoading({
            title: "处理中...",
          });

          // 使用数据库直接更新订单状态
          const db = wx.cloud.database();
          db.collection("orders")
            .doc(this.data.orderInfo.id)
            .update({
              data: {
                status: "已取消",
                updateTime: new Date(),
              },
            })
            .then(() => {
              wx.hideLoading();

              // 重新加载订单详情以获取更新后的数据
              this.loadOrderDetail(this.data.orderInfo.id);

              wx.showToast({
                title: "已取消预约",
                icon: "success",
              });
            })
            .catch((err) => {
              console.error("取消订单失败:", err);
              wx.hideLoading();
              wx.showToast({
                title: "取消失败，请重试",
                icon: "none",
              });
            });
        }
      },
    });
  },

  // 联系门店
  contactStore: function () {
    wx.makePhoneCall({
      phoneNumber: this.data.orderInfo.contactPhone,
      fail: () => {
        wx.showToast({
          title: "拨打电话失败",
          icon: "none",
        });
      },
    });
  },

  // 评价服务
  writeReview: function () {
    wx.navigateTo({
      url: "/pages/review/review?orderId=" + this.data.orderInfo.id,
    });
  },

  // 再次预约
  orderAgain: function () {
    wx.navigateTo({
      url: "/pages/appointment-service/appointment-service",
    });
  },

  // 返回上一页
  onBack: function () {
    wx.navigateBack();
  },

  // 拨打电话
  callPhone: function () {
    wx.makePhoneCall({
      phoneNumber: this.data.orderInfo.contactPhone.replace(/\*+/g, ""),
      fail: () => {
        wx.showToast({
          title: "拨打电话失败",
          icon: "none",
        });
      },
    });
  },

  // 格式化日期为订单号格式
  formatDateForOrderNo: function (timestamp) {
    if (!timestamp) return "00000000";

    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    // 已不再使用时间戳毫秒部分，而是使用数据库自增计数器
    // 但由于这是前端页面用于显示历史订单，我们使用一个默认序列
    const sequence = "0001";

    return `${year}${month}${day}${sequence}`;
  },

  // 获取格式化的预约时间
  getFormattedAppointmentTime: function (orderData, appointment) {
    // 1. 首先尝试从预约信息中获取预约时间
    if (appointment && appointment.appointmentTime) {
      return this.formatTime(appointment.appointmentTime);
    }

    // 2. 如果没有预约时间，但有服务开始时间
    if (appointment && appointment.serviceStartTime) {
      return this.formatTime(appointment.serviceStartTime);
    }

    // 3. 如果预约记录存在但没有时间，尝试从预约创建时间推断
    if (appointment && appointment.createTime) {
      const serviceTime = new Date(appointment.createTime);
      serviceTime.setHours(serviceTime.getHours() + 1);
      return this.formatTime(serviceTime) + " (预计)";
    }

    // 4. 根据订单状态提供合适的默认文本
    if (orderData.status === "待支付") {
      return "支付后安排服务时间";
    } else if (orderData.status === "已支付") {
      return "等待商家安排";
    } else if (orderData.status === "服务中") {
      // 如果正在服务中，使用更新时间作为预计时间
      const serviceTime = new Date(orderData.updateTime);
      return this.formatTime(serviceTime) + " (开始服务)";
    } else if (orderData.status === "已完成") {
      return "已完成服务";
    } else if (orderData.status === "已取消") {
      return "订单已取消";
    }

    // 5. 如果以上逻辑都不适用，返回默认文本
    return "未设置预约时间";
  },
});
