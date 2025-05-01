// pages/appointment-payment/appointment-payment.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    current: 2, // Current step in the appointment process
    steps: [
      { title: '选择服务', status: 'finish' },
      { title: '预约时间', status: 'finish' },
      { title: '填写信息', status: 'finish' },
      { title: '支付订单', status: 'process' }
    ],
    currentStep: 3,
    
    appointmentInfo: {
      storeName: '车店智能养护中心(总店)',
      appointmentTime: '2023-07-20 14:30',
      carModel: '奥迪 A6L 2020款'
    },
    
    serviceInfo: {
      name: '全车深度养护',
      description: '包含全车清洗、内饰清洁、发动机舱清洗等服务',
      price: 399.00
    },
    
    paymentMethods: [
      { id: 'wechat', name: '微信支付', icon: 'wechat', balance: null, selected: true },
      { id: 'balance', name: '余额支付', icon: 'wallet', balance: 280.50, selected: false },
      { id: 'card', name: '会员卡支付', icon: 'vip', balance: 500.00, selected: false }
    ],
    
    // Coupon data
    showCouponPopup: false,
    selectedCouponIndex: -1,
    coupons: [
      { 
        id: 1, 
        name: '新用户专享券', 
        amount: 50, 
        condition: '满300可用', 
        validity: '2023-07-01至2023-08-30',
        minAmount: 300,
        disabled: false
      },
      { 
        id: 2, 
        name: '全车养护优惠券', 
        amount: 30, 
        condition: '满200可用', 
        validity: '2023-07-15至2023-07-30',
        minAmount: 200,
        disabled: false
      },
      { 
        id: 3, 
        name: '会员日专享券', 
        amount: 100, 
        condition: '满500可用', 
        validity: '2023-07-20至2023-07-20',
        minAmount: 500,
        disabled: true
      }
    ],
    
    // Payment calculation
    paymentSummary: {
      serviceAmount: 399.00,
      discount: 0,
      totalAmount: 399.00
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // Get appointment data from previous page or from API
    // For demo, we use mock data
    this.calculatePayment();
  },

  /**
   * 选择支付方式
   */
  selectPaymentMethod: function(e) {
    const index = e.currentTarget.dataset.index;
    const paymentMethods = this.data.paymentMethods.map((item, i) => {
      return {
        ...item,
        selected: i === index
      };
    });
    
    this.setData({ paymentMethods });
  },

  /**
   * 打开优惠券选择弹窗
   */
  showCouponSelector: function() {
    this.setData({ showCouponPopup: true });
  },

  /**
   * 关闭优惠券选择弹窗
   */
  closeCouponPopup: function() {
    this.setData({ showCouponPopup: false });
  },

  /**
   * 选择优惠券
   */
  selectCoupon: function(e) {
    const index = e.currentTarget.dataset.index;
    const coupon = this.data.coupons[index];
    
    if (coupon.disabled) return;
    
    this.setData({ 
      selectedCouponIndex: index,
      showCouponPopup: false
    });
    
    this.calculatePayment();
  },

  /**
   * 清除优惠券选择
   */
  clearCoupon: function() {
    this.setData({ 
      selectedCouponIndex: -1,
      showCouponPopup: false
    });
    
    this.calculatePayment();
  },

  /**
   * 计算支付
   */
  calculatePayment: function() {
    const { serviceInfo, selectedCouponIndex, coupons } = this.data;
    let discount = 0;
    
    // Apply coupon discount if selected
    if (selectedCouponIndex !== -1) {
      const selectedCoupon = coupons[selectedCouponIndex];
      if (serviceInfo.price >= selectedCoupon.minAmount && !selectedCoupon.disabled) {
        discount = selectedCoupon.amount;
      }
    }
    
    const totalAmount = serviceInfo.price - discount;
    
    this.setData({
      'paymentSummary.serviceAmount': serviceInfo.price,
      'paymentSummary.discount': discount,
      'paymentSummary.totalAmount': totalAmount
    });
  },

  /**
   * 确认支付
   */
  submitPayment: function() {
    const { paymentMethods, paymentSummary } = this.data;
    const selectedMethod = paymentMethods.find(method => method.selected);
    
    // Check if selected payment method has sufficient balance
    if (selectedMethod.balance !== null && selectedMethod.balance < paymentSummary.totalAmount) {
      wx.showToast({
        title: '余额不足',
        icon: 'none'
      });
      return;
    }
    
    // Show loading
    wx.showLoading({
      title: '处理支付中...',
    });
    
    // Simulate payment processing
    setTimeout(() => {
      wx.hideLoading();
      
      // For demo purposes, always succeed
      wx.showToast({
        title: '支付成功',
        icon: 'success',
        duration: 2000
      });
      
      // Navigate to order detail or success page
      setTimeout(() => {
        wx.redirectTo({
          url: '/pages/order/order?status=success',
        });
      }, 2000);
      
    }, 1500);
  }
}) 