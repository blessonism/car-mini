// pages/appointment-payment/appointment-payment.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 预约信息
    date: "2023-07-20",
    day: "周四",
    time: "14:30",

    // 支付方式选择
    selectedPayment: "wechat",
    paymentMethods: [
      {
        id: "wechat",
        name: "微信支付",
        desc: "微信账号直接支付",
        icon: "wechat.png",
      },
      {
        id: "balance",
        name: "余额支付",
        desc: "账户余额直接支付",
        icon: "wallet-red.png",
        balance: 280.5,
      },
      {
        id: "card",
        name: "会员卡",
        desc: "会员卡余额支付",
        icon: "vip_card.png",
        balance: 500,
      },
    ],

    // 优惠券选择
    selectedCouponIndex: -1,
    coupons: [
      {
        id: 1,
        name: "新用户专享券",
        amount: 50,
        condition: "满300可用",
        validity: "2023-07-01至2023-08-30",
        minAmount: 300,
        disabled: false,
      },
      {
        id: 2,
        name: "全车养护优惠券",
        amount: 30,
        condition: "满200可用",
        validity: "2023-07-15至2023-07-30",
        minAmount: 200,
        disabled: false,
      },
      {
        id: 3,
        name: "会员日专享券",
        amount: 100,
        condition: "满500可用",
        validity: "2023-07-20至2023-07-20",
        minAmount: 500,
        disabled: true,
      },
    ],

    // 价格计算
    servicePrice: 39.9,
    couponDiscount: 5.0,
    memberDiscount: 1.9,
    totalPrice: 33.0,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 从上一页获取数据
    if (options) {
      const { date, day, time, price } = options;
      if (date && day && time) {
        this.setData({
          date,
          day,
          time,
        });
      }

      if (price) {
        const servicePrice = parseFloat(price);
        // 重新计算总价
        this.calculateTotalPrice(servicePrice);
      }
    }
  },

  /**
   * 选择支付方式
   */
  selectPayment: function (e) {
    const payment = e.currentTarget.dataset.payment;

    // 余额检查
    const paymentMethod = this.data.paymentMethods.find(
      (m) => m.id === payment
    );
    if (paymentMethod && paymentMethod.balance !== undefined) {
      // 检查余额是否足够
      if (paymentMethod.balance < this.data.totalPrice) {
        wx.showToast({
          title: `${paymentMethod.name}余额不足`,
          icon: "none",
        });
        return;
      }
    }

    this.setData({ selectedPayment: payment });
  },

  /**
   * 显示优惠券弹窗
   */
  showCouponSelector: function () {
    wx.showToast({
      title: "优惠券选择功能开发中",
      icon: "none",
    });

    // 临时直接设置
    this.setData({
      selectedCouponIndex: 0,
    });
  },

  /**
   * 计算最终价格
   */
  calculateTotalPrice: function (servicePrice) {
    if (!servicePrice) {
      servicePrice = this.data.servicePrice;
    }

    const couponDiscount = this.data.couponDiscount;
    const memberDiscount = this.data.memberDiscount;
    const totalPrice = (servicePrice - couponDiscount - memberDiscount).toFixed(
      1
    );

    this.setData({
      servicePrice,
      totalPrice,
    });
  },

  /**
   * 提交支付
   */
  submitPayment: function () {
    const selectedPayment = this.data.selectedPayment;

    wx.showLoading({
      title: "处理支付中",
    });

    // 模拟支付处理
    setTimeout(() => {
      wx.hideLoading();

      wx.showToast({
        title: "支付成功",
        icon: "success",
      });

      // 支付成功后跳转到订单页
      setTimeout(() => {
        wx.navigateTo({
          url: "/pages/order/order",
        });
      }, 1500);
    }, 1000);
  },
});
