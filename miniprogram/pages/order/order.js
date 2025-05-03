// pages/order/order.js
Page({
  data: {
    activeTab: "all",
    statusText: {
      waiting: "等待服务",
      in_service: "服务中",
      washing: "洗车中",
      completed: "已完成",
      waiting_arrival: "待到店",
      待支付: "待支付",
      已支付: "已支付",
      服务中: "服务中",
      已完成: "已完成",
      已取消: "已取消",
    },
    orders: [],
    filteredOrders: [],
    isLoading: true,
  },

  onLoad: function (options) {
    this.loadOrders();
  },

  // 加载订单列表
  loadOrders: function (status) {
    this.setData({ isLoading: true });

    const queryParams = {};
    if (status && status !== "all") {
      queryParams.status = status;
    }

    wx.cloud
      .callFunction({
        name: "getUserOrders",
        data: queryParams,
      })
      .then((res) => {
        if (res.result && res.result.success) {
          // 处理订单数据，转换为UI所需格式
          const orders = res.result.data.map((order) => {
            // 格式化预约时间
            let appointmentTime = "";
            // 状态描述文本
            let statusDesc = "";

            // 根据订单状态设置状态描述
            switch (order.status) {
              case "待支付":
                statusDesc = "等待支付，请尽快完成";
                break;
              case "已支付":
                statusDesc = "预约成功，等待门店服务";
                break;
              case "服务中":
                statusDesc = "正在门店接受服务";
                break;
              case "已完成":
                statusDesc = "服务已完成，感谢您的信任";
                break;
              case "已取消":
                statusDesc = "订单已取消";
                break;
              default:
                statusDesc = "订单状态未知";
            }

            // 1. 首先尝试从预约信息中获取预约时间
            if (order.appointment && order.appointment.appointmentTime) {
              appointmentTime = this.formatTime(
                order.appointment.appointmentTime
              );
            }
            // 2. 如果没有预约时间，但有创建时间，则使用创建时间加1小时作为预计服务时间
            else if (order.createTime) {
              const serviceTime = new Date(order.createTime);
              serviceTime.setHours(serviceTime.getHours() + 1);
              appointmentTime = this.formatTime(serviceTime) + " (预计)";
            }
            // 3. 根据订单状态提供合适的默认文本
            else {
              if (order.status === "待支付") {
                appointmentTime = "支付后安排";
              } else if (order.status === "已完成") {
                appointmentTime = "已完成服务";
              } else if (order.status === "已取消") {
                appointmentTime = "订单已取消";
              } else {
                appointmentTime = "暂无预约时间";
              }
            }

            // 对于已完成的订单，使用状态描述替代预约时间
            const displayTime = statusDesc;

            return {
              id: order._id,
              orderNo:
                order.orderNo || this.formatOrderNoFromDate(order.createTime),
              serviceName: this.getServiceNames(order.orderItems),
              carModel: order.vehicle ? order.vehicle.model : "未知车型",
              carBrand: order.vehicle ? order.vehicle.brand : "",
              licensePlate: order.vehicle ? order.vehicle.plate : "未知车牌",
              totalPrice: order.actualAmount,
              status: order.status,
              paymentStatus: order.paymentStatus,
              createTime: this.formatTime(order.createTime),
              appointmentTime: displayTime,
              statusDesc: statusDesc,
            };
          });

          this.setData({
            orders: orders,
            filteredOrders: orders,
            isLoading: false,
          });
        } else {
          this.setData({ isLoading: false });
          wx.showToast({
            title: "获取订单列表失败",
            icon: "none",
          });
        }
      })
      .catch((err) => {
        console.error("获取订单列表失败:", err);
        this.setData({ isLoading: false });
        wx.showToast({
          title: "获取订单列表失败",
          icon: "none",
        });
      });
  },

  // 从订单项目中获取服务名称
  getServiceNames: function (orderItems) {
    if (!orderItems || orderItems.length === 0) {
      return "未知服务";
    }

    return orderItems.map((item) => item.name).join("、");
  },

  // 格式化时间
  formatTime: function (timestamp) {
    if (!timestamp) return "";

    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();

    return `${year}-${month}-${day} ${hour}:${minute}`;
  },

  // 格式化订单号（用于旧数据）
  formatOrderNoFromDate: function (timestamp) {
    if (!timestamp) return "CS00000000";

    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    // 已不再使用时间戳毫秒部分，而是使用数据库自增计数器
    // 但由于这是前端页面用于显示历史订单，我们使用一个默认序列
    const sequence = "0001";

    return `CS${year}${month}${day}${sequence}`;
  },

  onTabChange(e) {
    const status = e.currentTarget.dataset.value;
    this.setData({
      activeTab: status,
    });

    // 根据不同标签加载不同状态的订单
    if (status === "all") {
      this.loadOrders();
    } else if (status === "waiting") {
      this.loadOrders("待支付");
    } else if (status === "in_service") {
      this.loadOrders("服务中");
    } else if (status === "waiting_arrival") {
      this.loadOrders("已支付"); // 已支付但未到店的订单
    }
  },

  viewOrderDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?id=${id}`,
    });
  },

  contactStore(e) {
    // 模拟拨打电话联系店主
    wx.showActionSheet({
      itemList: ["拨打电话", "发送消息"],
      success: function (res) {
        if (res.tapIndex === 0) {
          // 拨打电话
          wx.makePhoneCall({
            phoneNumber: "13812345678",
            fail: function () {
              wx.showToast({
                title: "拨号取消",
                icon: "none",
              });
            },
          });
        } else if (res.tapIndex === 1) {
          // 发送消息
          wx.navigateTo({
            url: "/pages/message/message",
            fail: function () {
              wx.showToast({
                title: "消息功能开发中",
                icon: "none",
              });
            },
          });
        }
      },
    });
  },

  // 取消订单
  cancelOrder(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: "确认取消",
      content: "确定要取消该订单吗？",
      success: (res) => {
        if (res.confirm) {
          this.updateOrderStatus(id, "已取消");
        }
      },
    });
  },

  // 更新订单状态
  updateOrderStatus: function (orderId, status) {
    wx.showLoading({ title: "处理中..." });

    wx.cloud
      .callFunction({
        name: "updateOrderStatus",
        data: {
          orderId: orderId,
          status: status,
        },
      })
      .then((res) => {
        wx.hideLoading();

        if (res.result && res.result.success) {
          wx.showToast({
            title: "操作成功",
            icon: "success",
          });

          // 重新加载订单列表
          this.loadOrders();
        } else {
          wx.showToast({
            title: res.result.message || "操作失败",
            icon: "none",
          });
        }
      })
      .catch((err) => {
        wx.hideLoading();
        console.error("更新订单状态失败:", err);
        wx.showToast({
          title: "操作失败，请重试",
          icon: "none",
        });
      });
  },

  // 取消预约
  cancelAppointment(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: "确认取消",
      content: "确定要取消该预约吗？",
      success: (res) => {
        if (res.confirm) {
          wx.cloud
            .callFunction({
              name: "updateAppointmentStatus",
              data: {
                appointmentId: id,
                status: "已取消",
              },
            })
            .then((res) => {
              if (res.result && res.result.success) {
                wx.showToast({
                  title: "预约已取消",
                  icon: "success",
                });

                this.loadOrders();
              } else {
                wx.showToast({
                  title: res.result.message || "取消预约失败",
                  icon: "none",
                });
              }
            })
            .catch((err) => {
              console.error("取消预约失败:", err);
              wx.showToast({
                title: "取消预约失败",
                icon: "none",
              });
            });
        }
      },
    });
  },

  trackService(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?id=${id}`,
    });
  },

  reappointment(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/appointment-service/appointment-service?reappoint=true&id=${id}`,
    });
  },

  onShow: function () {
    // 页面显示时重新加载数据
    this.loadOrders();

    // 页面显示时，更新自定义tabBar的选中状态
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 2,
      });
    }
  },
});
