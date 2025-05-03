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
    // 实际项目中应该从服务器获取订单详情
    // 这里使用模拟数据

    // 模拟API请求延迟
    wx.showLoading({
      title: "加载中...",
    });

    setTimeout(() => {
      wx.hideLoading();

      // 不同的订单状态测试
      let status = "pending";
      let mockData = {};

      // 根据订单ID尾号模拟不同状态
      const lastChar = orderId.charAt(orderId.length - 1);

      if (lastChar === "1") {
        status = "processing";
        mockData = {
          id: orderId,
          orderNo: "WXC2023081811001",
          status: "processing",
          appointmentTime: "2023年8月18日 11:00",
          storeName: "车店智能养护中心(总店)",
          contactPhone: "138****5678",
          amount: 149.1,
          discount: 0,
          totalAmount: 149.1,
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
        };
      } else if (lastChar === "2") {
        status = "completed";
        mockData = {
          id: orderId,
          orderNo: "WXC2023081611002",
          status: "completed",
          appointmentTime: "2023年8月16日 15:30",
          storeName: "车店智能养护中心(天河店)",
          contactPhone: "138****5678",
          amount: 59.9,
          discount: 10,
          totalAmount: 49.9,
          technician: "王师傅",
          paymentMethod: "微信支付",
          carInfo: {
            plate: "粤A98765",
            brand: "宝马",
            model: "3系",
            color: "白色",
          },
          services: [
            {
              id: 1,
              name: "精致洗车",
              price: 59.9,
            },
          ],
          remark: "",
          steps: [
            {
              title: "订单已提交",
              time: "8月16日 14:30",
              status: "finish",
            },
            {
              title: "订单已确认",
              time: "8月16日 14:35",
              status: "finish",
            },
            {
              title: "服务进行中",
              time: "8月16日 15:30",
              status: "finish",
            },
            {
              title: "服务已完成",
              time: "8月16日 16:10",
              status: "finish",
            },
            {
              title: "客户已确认",
              time: "8月16日 16:15",
              status: "finish",
            },
          ],
          customer: {
            name: "李先生",
          },
        };
      } else if (lastChar === "3") {
        status = "cancelled";
        mockData = {
          id: orderId,
          orderNo: "WXC2023081511003",
          status: "cancelled",
          appointmentTime: "2023年8月15日 10:00",
          storeName: "车店智能养护中心(总店)",
          contactPhone: "138****5678",
          amount: 299,
          discount: 0,
          totalAmount: 299,
          technician: "",
          paymentMethod: "支付宝",
          carInfo: {
            plate: "粤B54321",
            brand: "奥迪",
            model: "A6L",
            color: "黑色",
          },
          services: [
            {
              id: 1,
              name: "机油更换",
              price: 299,
            },
          ],
          remark: "下班后再去",
          steps: [
            {
              title: "订单已提交",
              time: "8月14日 20:30",
              status: "finish",
            },
            {
              title: "订单已确认",
              time: "8月14日 20:35",
              status: "finish",
            },
            {
              title: "订单已取消",
              time: "8月15日 08:30",
              status: "finish",
            },
          ],
          customer: {
            name: "赵先生",
          },
        };
      } else {
        // 默认：等待服务 (待到店/待服务)
        status = "pending";
        mockData = {
          id: orderId,
          orderNo: "WXC2023082011004",
          status: "pending",
          appointmentTime: "2023年8月20日 14:00",
          storeName: "车店智能养护中心(总店)",
          contactPhone: "138****5678",
          amount: 39.9,
          discount: 0,
          totalAmount: 39.9,
          technician: "",
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
              name: "标准洗车",
              price: 39.9,
            },
          ],
          remark: "",
          steps: [
            {
              title: "订单已提交",
              time: "8月18日 18:30",
              status: "finish",
            },
            {
              title: "订单已确认",
              time: "8月18日 18:35",
              status: "finish",
            },
            {
              title: "服务进行中",
              time: "待开始",
              status: "wait",
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
        };
      }

      this.setData({
        orderInfo: mockData,
        currentStep:
          mockData.steps.findIndex((step) => step.status === "process") || 0,
      });

      this.updateStatusText();
    }, 500);
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

          setTimeout(() => {
            wx.hideLoading();

            this.setData({
              "orderInfo.status": "cancelled",
            });

            this.updateStatusText();

            wx.showToast({
              title: "已取消预约",
              icon: "success",
            });
          }, 1000);
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
});
