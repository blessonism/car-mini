// pages/membership-topup/membership-topup.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 用户账户信息
    accountInfo: {
      balance: 128.5,
      memberLevel: "普通会员",
    },

    // 充值金额选项
    topupAmounts: [
      { value: 50, gift: 5 },
      { value: 100, gift: 12 },
      { value: 200, gift: 30 },
      { value: 300, gift: 50 },
      { value: 500, gift: 100 },
      { value: 1000, gift: 250 },
    ],

    // 支付方式
    paymentMethods: [
      { id: "wechat", name: "微信支付", icon: "/assets/icons/wechat-pay.png" },
      { id: "alipay", name: "支付宝", icon: "/assets/icons/alipay.png" },
      { id: "card", name: "银行卡支付", icon: "/assets/icons/card.png" },
    ],

    // 会员权益
    benefits: [
      { text: "会员专享折扣", icon: "discount" },
      { text: "积分双倍累计", icon: "integral" },
      { text: "生日特别优惠", icon: "gift" },
      { text: "专属活动邀请", icon: "notification" },
      { text: "优先预约服务", icon: "time" },
    ],

    // 当前选中的充值金额索引
    selectedAmountIndex: -1,

    // 自定义充值金额
    customAmount: "",

    // 是否显示自定义金额输入
    showCustomInput: false,

    // 当前选中的支付方式
    selectedPaymentIndex: 0,

    // 最终支付金额
    totalAmount: 0,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 默认选中第一个选项
    this.selectAmount({ currentTarget: { dataset: { index: 0 } } });
  },

  /**
   * 选择充值金额
   */
  selectAmount: function (e) {
    const index = parseInt(e.currentTarget.dataset.index);

    this.setData({
      selectedAmountIndex: index,
      customAmount: "",
      totalAmount: this.data.topupAmounts[index].value,
    });
  },

  /**
   * 自定义金额输入变化
   */
  onCustomAmountChange: function (e) {
    const value = e.detail.value;
    let amount = 0;

    if (value && !isNaN(value)) {
      amount = parseFloat(value);
    }

    this.setData({
      customAmount: value,
      selectedAmountIndex: -1,
      totalAmount: amount,
    });
  },

  /**
   * 确认充值
   */
  confirmTopup: function () {
    // 获取充值金额
    let amount = 0;
    let gift = 0;

    if (this.data.selectedAmountIndex >= 0) {
      const selected = this.data.topupAmounts[this.data.selectedAmountIndex];
      amount = selected.value;
      gift = selected.gift;
    } else if (this.data.customAmount) {
      amount = parseFloat(this.data.customAmount);
    }

    if (amount <= 0) {
      wx.showToast({
        title: "请选择或输入有效的充值金额",
        icon: "none",
      });
      return;
    }

    // 显示充值确认弹窗
    wx.showModal({
      title: "确认充值",
      content: `您将充值${amount}元${gift > 0 ? "，赠送" + gift + "元" : ""}`,
      confirmText: "确认充值",
      confirmColor: "#3b82f6",
      success: (res) => {
        if (res.confirm) {
          this.processPayment(amount, gift);
        }
      },
    });
  },

  /**
   * 处理支付流程
   */
  processPayment: function (amount, gift) {
    // 显示加载中
    wx.showLoading({
      title: "处理中...",
    });

    // 这里应该调用真实的支付API，这里使用模拟流程
    setTimeout(() => {
      wx.hideLoading();

      // 计算充值后的余额
      const newBalance = (
        this.data.accountInfo.balance +
        amount +
        gift
      ).toFixed(2);

      // 更新本地账户信息
      this.setData({
        "accountInfo.balance": newBalance,
      });

      // 显示充值成功提示
      wx.showToast({
        title: "充值成功",
        icon: "success",
        duration: 2000,
        success: () => {
          // 2秒后返回上一页
          setTimeout(() => {
            wx.navigateBack();
          }, 2000);
        },
      });
    }, 1500);
  },

  /**
   * 跳转到会员详情页
   */
  navigateToMemberDetail: function () {
    wx.navigateTo({
      url: "/pages/membership-detail/membership-detail",
    });
  },
});
