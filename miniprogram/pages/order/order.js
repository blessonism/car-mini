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
    },
    orders: [
      {
        id: "001",
        serviceName: "标准洗车",
        carModel: "奔驰 C260L",
        licensePlate: "粤B12345",
        totalPrice: "39.9",
        status: "in_service",
      },
      {
        id: "002",
        serviceName: "精致洗车",
        carModel: "奥迪A6L",
        licensePlate: "京A12345",
        totalPrice: "59.9",
        status: "waiting",
      },
      {
        id: "003",
        serviceName: "机油更换",
        carModel: "奔驰 C260L",
        licensePlate: "粤B12345",
        totalPrice: "299",
        status: "completed",
      },
      {
        id: "004",
        serviceName: "轮胎更换",
        carModel: "奔驰 C260L",
        licensePlate: "粤B12345",
        totalPrice: "328",
        status: "washing",
      },
    ],
    filteredOrders: [],
  },

  onLoad: function (options) {
    this.filterOrdersByStatus("all");
  },

  onTabChange(e) {
    const status = e.currentTarget.dataset.value;
    this.setData({
      activeTab: status,
    });
    this.filterOrdersByStatus(status);
  },

  filterOrdersByStatus(status) {
    let filtered = this.data.orders;

    if (status !== "all") {
      filtered = this.data.orders.filter((order) => {
        if (status === "waiting_arrival")
          return order.status === "waiting_arrival";
        if (status === "waiting") return order.status === "waiting";
        if (status === "in_service")
          return order.status === "in_service" || order.status === "washing";
        return false;
      });
    }

    this.setData({
      filteredOrders: filtered,
    });
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

  cancelAppointment(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: "确认取消",
      content: "确定要取消该预约吗？",
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: "预约已取消",
            icon: "success",
          });

          this.onLoad();
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
    // 页面显示时，更新自定义tabBar的选中状态
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 2,
      });
    }
  },
});
