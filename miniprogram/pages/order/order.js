// pages/order/order.js
const auth = require("../../utils/auth"); // 引入auth模块

// 存储相关的key常量
const STORAGE_KEYS = {
  ORDERS_DATA: "ordersData",
  LAST_ORDERS_REFRESH: "lastOrdersRefresh",
};

// 数据刷新的最小间隔时间（毫秒）- 默认1小时
const REFRESH_INTERVAL = 60 * 60 * 1000;

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
    isRefreshing: false,
    lastTab: "all", // 记录上次选中的标签
  },

  onLoad: function (options) {
    // 首次加载时一定要获取数据
    this.loadOrdersWithCache();
  },

  onShow: function () {
    // 页面显示时，更新自定义tabBar的选中状态
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 2, // 订单页面索引
      });
    }

    // 检查是否需要刷新数据（当前标签改变或数据过期时）
    const currentTab = this.data.activeTab;
    if (currentTab !== this.data.lastTab) {
      this.loadOrdersWithCache(currentTab);
      this.setData({ lastTab: currentTab });
    } else if (this.shouldRefreshOrders()) {
      this.loadOrdersWithCache(currentTab);
    }
  },

  // 下拉刷新处理函数
  onPullDownRefresh: function () {
    if (this.data.isRefreshing) {
      wx.stopPullDownRefresh();
      return;
    }

    this.setData({ isRefreshing: true });

    // 强制刷新当前标签的数据
    const status = this.getStatusByTab(this.data.activeTab);
    this.loadOrders(status, true)
      .then(() => {
        this.setData({ isRefreshing: false });
        wx.stopPullDownRefresh();
        wx.showToast({ title: "刷新成功", icon: "success" });
      })
      .catch((err) => {
        this.setData({ isRefreshing: false });
        wx.stopPullDownRefresh();
        wx.showToast({ title: "刷新失败", icon: "none" });
        console.error("刷新订单数据失败:", err);
      });
  },

  // 检查是否需要刷新订单数据
  shouldRefreshOrders: function () {
    try {
      const lastRefresh =
        wx.getStorageSync(STORAGE_KEYS.LAST_ORDERS_REFRESH) || 0;
      return Date.now() - lastRefresh > REFRESH_INTERVAL;
    } catch (error) {
      console.error("检查订单刷新状态出错", error);
      return true; // 出错时默认需要刷新
    }
  },

  // 更新订单刷新时间戳
  updateOrdersRefreshTime: function () {
    try {
      wx.setStorageSync(STORAGE_KEYS.LAST_ORDERS_REFRESH, Date.now());
    } catch (error) {
      console.error("更新订单刷新时间戳出错", error);
    }
  },

  // 从缓存获取订单数据
  getStoredOrders: function () {
    try {
      return wx.getStorageSync(STORAGE_KEYS.ORDERS_DATA) || null;
    } catch (error) {
      console.error("获取订单缓存数据出错", error);
      return null;
    }
  },

  // 保存订单数据到缓存
  saveOrdersToCache: function (orders, status = "all") {
    try {
      // 使用key-value方式存储，方便按状态获取
      const cachedOrders = wx.getStorageSync(STORAGE_KEYS.ORDERS_DATA) || {};
      cachedOrders[status] = {
        data: orders,
        timestamp: Date.now(),
      };
      wx.setStorageSync(STORAGE_KEYS.ORDERS_DATA, cachedOrders);
      this.updateOrdersRefreshTime();
    } catch (error) {
      console.error("保存订单数据到缓存出错", error);
    }
  },

  // 根据标签值获取对应的状态
  getStatusByTab: function (tab) {
    const statusMap = {
      all: null,
      waiting: "待支付",
      in_service: "服务中",
      waiting_arrival: "已支付",
    };
    return statusMap[tab] || null;
  },

  // 使用缓存加载订单
  loadOrdersWithCache: function (tabStatus = "all") {
    const status = this.getStatusByTab(tabStatus || this.data.activeTab);

    // 尝试从缓存获取数据
    const cachedOrders = this.getStoredOrders();
    const statusKey = status || "all";

    if (
      cachedOrders &&
      cachedOrders[statusKey] &&
      !this.shouldRefreshOrders()
    ) {
      // 使用缓存数据
      const orders = cachedOrders[statusKey].data;
      this.setData({
        orders: orders,
        filteredOrders: orders,
        isLoading: false,
        activeTab: tabStatus || this.data.activeTab,
      });
      return Promise.resolve(orders);
    } else {
      // 缓存不存在或已过期，重新加载
      return this.loadOrders(status, true);
    }
  },

  // 加载订单列表
  loadOrders: function (status, forceRefresh = false) {
    // 如果不是强制刷新且不需要刷新，尝试使用缓存
    if (!forceRefresh && !this.shouldRefreshOrders()) {
      const cachedOrders = this.getStoredOrders();
      const statusKey = status || "all";

      if (cachedOrders && cachedOrders[statusKey]) {
        const orders = cachedOrders[statusKey].data;
        this.setData({
          orders: orders,
          filteredOrders: orders,
          isLoading: false,
        });
        return Promise.resolve(orders);
      }
    }

    this.setData({ isLoading: true });

    const queryParams = {};
    if (status && status !== "all") {
      queryParams.status = status;
    }

    return new Promise((resolve, reject) => {
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

            // 保存数据到本地状态
            this.setData({
              orders: orders,
              filteredOrders: orders,
              isLoading: false,
            });

            // 保存到缓存
            this.saveOrdersToCache(orders, status || "all");

            resolve(orders);
          } else {
            this.setData({ isLoading: false });
            wx.showToast({
              title: "获取订单列表失败",
              icon: "none",
            });
            reject(new Error("获取订单列表失败"));
          }
        })
        .catch((err) => {
          console.error("获取订单列表失败:", err);
          this.setData({ isLoading: false });
          wx.showToast({
            title: "获取订单列表失败",
            icon: "none",
          });
          reject(err);
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
      lastTab: status, // 更新最后选中的标签
    });

    // 使用缓存策略加载不同状态的订单
    this.loadOrdersWithCache(status);
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

          // 强制刷新数据
          this.loadOrders(null, true);
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
          title: "操作失败",
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
          wx.showLoading({ title: "取消中..." });

          wx.cloud
            .callFunction({
              name: "updateAppointmentStatus",
              data: {
                appointmentId: id,
                status: "cancelled",
              },
            })
            .then((res) => {
              wx.hideLoading();

              if (res.result && res.result.success) {
                wx.showToast({
                  title: "取消成功",
                  icon: "success",
                });

                // 强制刷新数据
                this.loadOrders(null, true);
              } else {
                wx.showToast({
                  title: res.result.message || "取消失败",
                  icon: "none",
                });
              }
            })
            .catch((err) => {
              wx.hideLoading();
              console.error("取消预约失败:", err);
              wx.showToast({
                title: "取消失败",
                icon: "none",
              });
            });
        }
      },
    });
  },

  // 追踪服务
  trackService(e) {
    const id = e.currentTarget.dataset.id;
    wx.showToast({
      title: "服务追踪功能开发中",
      icon: "none",
    });
  },

  // 重新预约
  reappointment(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/appointment-service/appointment-service?reappoint=true&id=${id}`,
    });
  },
});
