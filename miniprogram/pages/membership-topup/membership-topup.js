// pages/membership-topup/membership-topup.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 用户账户信息
    accountInfo: {
      balance: 0,
      memberLevel: '普通会员'
    },
    
    // 充值金额选项
    amountOptions: [
      { value: 100, desc: '充100送10', gift: 10 },
      { value: 200, desc: '充200送25', gift: 25 },
      { value: 500, desc: '充500送80', gift: 80 },
      { value: 1000, desc: '充1000送200', gift: 200 },
      { value: 2000, desc: '充2000送500', gift: 500 },
      { value: 5000, desc: '充5000送1500', gift: 1500 },
    ],
    
    // 支付方式
    paymentMethods: [
      { id: 'wechat', name: '微信支付', icon: '/assets/icons/wechat-pay.png' },
      { id: 'alipay', name: '支付宝', icon: '/assets/icons/alipay.png' },
      { id: 'card', name: '银行卡支付', icon: '/assets/icons/card.png' }
    ],
    
    // 会员权益
    benefits: [
      { text: '会员专享折扣', icon: 'discount' },
      { text: '积分双倍累计', icon: 'integral' },
      { text: '生日特别优惠', icon: 'gift' },
      { text: '专属活动邀请', icon: 'notification' },
      { text: '优先预约服务', icon: 'time' }
    ],
    
    // 当前选中的充值金额索引
    selectedAmountIndex: 0,
    
    // 自定义充值金额
    customAmount: '',
    
    // 是否显示自定义金额输入
    showCustomInput: false,
    
    // 当前选中的支付方式
    selectedPaymentIndex: 0,
    
    // 最终支付金额
    totalAmount: 100
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.loadUserAccountInfo();
  },
  
  /**
   * 加载用户账户信息
   */
  loadUserAccountInfo() {
    // 这里应该从API获取用户信息，现在使用模拟数据
    const accountInfo = {
      balance: 258.5,
      memberLevel: this.getMemberLevel(258.5)
    };
    
    this.setData({
      accountInfo,
      totalAmount: this.data.amountOptions[0].value
    });
  },
  
  /**
   * 根据账户余额确定会员等级
   */
  getMemberLevel(balance) {
    if (balance >= 5000) return '钻石会员';
    if (balance >= 2000) return '金牌会员';
    if (balance >= 500) return '银牌会员';
    return '普通会员';
  },
  
  /**
   * 选择充值金额
   */
  selectAmount(e) {
    const index = e.currentTarget.dataset.index;
    
    this.setData({
      selectedAmountIndex: index,
      showCustomInput: false,
      totalAmount: this.data.amountOptions[index].value,
      customAmount: ''
    });
  },
  
  /**
   * 显示自定义金额输入
   */
  showCustomAmountInput() {
    this.setData({
      showCustomInput: true,
      selectedAmountIndex: -1
    });
  },
  
  /**
   * 自定义金额输入变化
   */
  onCustomAmountChange(e) {
    const value = e.detail.value;
    let amount = 0;
    
    if (value && !isNaN(value)) {
      amount = Number(value);
    }
    
    this.setData({
      customAmount: value,
      totalAmount: amount
    });
  },
  
  /**
   * 选择支付方式
   */
  selectPayment(e) {
    const index = e.currentTarget.dataset.index;
    
    this.setData({
      selectedPaymentIndex: index
    });
  },
  
  /**
   * 确认充值
   */
  confirmTopup() {
    if (this.data.totalAmount <= 0) {
      wx.showToast({
        title: '请输入有效的充值金额',
        icon: 'none'
      });
      return;
    }
    
    const paymentMethod = this.data.paymentMethods[this.data.selectedPaymentIndex];
    
    // 显示支付确认弹窗
    wx.showModal({
      title: '确认充值',
      content: `您将使用${paymentMethod.name}充值${this.data.totalAmount}元`,
      confirmText: '确认支付',
      success: (res) => {
        if (res.confirm) {
          this.processPayment();
        }
      }
    });
  },
  
  /**
   * 处理支付流程
   */
  processPayment() {
    // 显示加载中
    wx.showLoading({
      title: '处理中...',
    });
    
    // 这里应该调用真实的支付API，这里使用模拟流程
    setTimeout(() => {
      wx.hideLoading();
      
      // 计算本次充值送的金额
      let giftAmount = 0;
      if (this.data.selectedAmountIndex !== -1 && this.data.selectedAmountIndex < this.data.amountOptions.length) {
        giftAmount = this.data.amountOptions[this.data.selectedAmountIndex].gift;
      }
      
      // 计算充值后的余额
      const newBalance = this.data.accountInfo.balance + this.data.totalAmount + giftAmount;
      const newMemberLevel = this.getMemberLevel(newBalance);
      
      // 更新本地账户信息
      this.setData({
        ['accountInfo.balance']: newBalance,
        ['accountInfo.memberLevel']: newMemberLevel
      });
      
      // 显示充值成功提示
      wx.showToast({
        title: '充值成功',
        icon: 'success',
        duration: 2000,
        success: () => {
          // 2秒后返回上一页
          setTimeout(() => {
            wx.navigateBack();
          }, 2000);
        }
      });
    }, 1500);
  },
  
  /**
   * 返回上一页
   */
  navigateBack() {
    wx.navigateBack();
  }
}) 