// pages/gift-card/gift-card.js
Page({
  data: {
    activeTab: 0, // 0: My Gift Cards, 1: Purchase Gift Cards
    totalBalance: 0,
    giftCards: [],
    usageRecords: [],
    hasGiftCards: false,
    hasUsageRecords: false,
    
    // Purchase tab data
    cardOptions: [
      { id: 1, amount: 100, price: 98, description: "赠送2元" },
      { id: 2, amount: 200, price: 195, description: "赠送5元" },
      { id: 3, amount: 500, price: 480, description: "赠送20元" },
      { id: 4, amount: 1000, price: 950, description: "赠送50元" }
    ],
    selectedCardOption: null,
    quantity: 1,
    paymentMethods: [
      { id: 1, name: "微信支付", icon: "/miniprogram/assets/icons/wechat-pay.png" },
      { id: 2, name: "支付宝", icon: "/miniprogram/assets/icons/alipay.png" },
      { id: 3, name: "银行卡", icon: "/miniprogram/assets/icons/card.png" }
    ],
    selectedPaymentMethod: null,
    isGift: false,
    friendPhone: '',
    
    // Order summary
    cardValue: 0,
    discount: 0,
    totalPayment: 0
  },

  onLoad: function() {
    this.loadGiftCardData();
    this.selectCardOption(this.data.cardOptions[0]);
    this.selectPaymentMethod(this.data.paymentMethods[0]);
    this.calculateOrderSummary();
  },

  // Tab related functions
  switchTab: function(e) {
    const tabIndex = e.currentTarget.dataset.index;
    this.setData({
      activeTab: tabIndex
    });
  },

  // My Gift Cards tab functions
  loadGiftCardData: function() {
    // In a real app, this would fetch data from the server
    // Mock data for demonstration
    const giftCards = [
      {
        id: 1,
        name: "通用礼品卡",
        amount: 200,
        status: "active", // active, used, expired
        expireDate: "2023-12-31"
      },
      {
        id: 2,
        name: "生日礼品卡",
        amount: 100,
        status: "active",
        expireDate: "2023-10-15"
      },
      {
        id: 3,
        name: "促销礼品卡",
        amount: 50,
        status: "used",
        expireDate: "2023-09-30"
      }
    ];

    const usageRecords = [
      {
        id: 1,
        description: "购买保养套餐",
        time: "2023-08-15 14:30",
        amount: -150,
        type: "expense"
      },
      {
        id: 2,
        description: "购买礼品卡",
        time: "2023-08-01 10:15",
        amount: 200,
        type: "income"
      },
      {
        id: 3,
        description: "轮胎更换",
        time: "2023-07-20 16:45",
        amount: -100,
        type: "expense"
      }
    ];

    // Calculate total balance
    let totalBalance = 0;
    giftCards.forEach(card => {
      if (card.status === "active") {
        totalBalance += card.amount;
      }
    });

    this.setData({
      giftCards,
      usageRecords,
      totalBalance,
      hasGiftCards: giftCards.length > 0,
      hasUsageRecords: usageRecords.length > 0
    });
  },

  useGiftCard: function(e) {
    const cardId = e.currentTarget.dataset.id;
    wx.showModal({
      title: '使用礼品卡',
      content: '确定要使用这张礼品卡吗？',
      success: (res) => {
        if (res.confirm) {
          // In a real app, this would make a server request
          wx.showToast({
            title: '礼品卡已使用',
            icon: 'success'
          });
          
          // For demo purposes, update the UI
          const giftCards = this.data.giftCards.map(card => {
            if (card.id === cardId) {
              return { ...card, status: 'used' };
            }
            return card;
          });
          
          // Recalculate total balance
          let totalBalance = 0;
          giftCards.forEach(card => {
            if (card.status === "active") {
              totalBalance += card.amount;
            }
          });
          
          this.setData({
            giftCards,
            totalBalance
          });
        }
      }
    });
  },

  shareGiftCard: function(e) {
    const cardId = e.currentTarget.dataset.id;
    // In a real app, this would open a sharing dialog
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  navigateToPurchase: function() {
    this.setData({
      activeTab: 1
    });
  },

  // Purchase Gift Cards tab functions
  selectCardOption: function(option) {
    this.setData({
      selectedCardOption: option,
      quantity: 1
    }, () => {
      this.calculateOrderSummary();
    });
  },

  tapCardOption: function(e) {
    const optionId = e.currentTarget.dataset.id;
    const option = this.data.cardOptions.find(opt => opt.id === optionId);
    this.selectCardOption(option);
  },

  decreaseQuantity: function() {
    if (this.data.quantity > 1) {
      this.setData({
        quantity: this.data.quantity - 1
      }, () => {
        this.calculateOrderSummary();
      });
    }
  },

  increaseQuantity: function() {
    this.setData({
      quantity: this.data.quantity + 1
    }, () => {
      this.calculateOrderSummary();
    });
  },

  quantityInput: function(e) {
    let quantity = parseInt(e.detail.value);
    if (isNaN(quantity) || quantity < 1) {
      quantity = 1;
    }
    this.setData({
      quantity
    }, () => {
      this.calculateOrderSummary();
    });
  },

  selectPaymentMethod: function(method) {
    this.setData({
      selectedPaymentMethod: method
    });
  },

  tapPaymentMethod: function(e) {
    const methodId = e.currentTarget.dataset.id;
    const method = this.data.paymentMethods.find(m => m.id === methodId);
    this.selectPaymentMethod(method);
  },

  toggleGiftOption: function() {
    this.setData({
      isGift: !this.data.isGift,
      friendPhone: this.data.isGift ? '' : this.data.friendPhone
    });
  },

  inputFriendPhone: function(e) {
    this.setData({
      friendPhone: e.detail.value
    });
  },

  calculateOrderSummary: function() {
    if (!this.data.selectedCardOption) return;
    
    const cardValue = this.data.selectedCardOption.amount * this.data.quantity;
    const totalPrice = this.data.selectedCardOption.price * this.data.quantity;
    const discount = cardValue - totalPrice;
    
    this.setData({
      cardValue,
      discount,
      totalPayment: totalPrice
    });
  },

  submitOrder: function() {
    if (!this.data.selectedCardOption || !this.data.selectedPaymentMethod) {
      wx.showToast({
        title: '请完成所有选项',
        icon: 'none'
      });
      return;
    }

    if (this.data.isGift && !this.data.friendPhone) {
      wx.showToast({
        title: '请输入好友手机号',
        icon: 'none'
      });
      return;
    }

    // In a real app, this would submit the order to the server
    wx.showLoading({
      title: '正在处理',
    });

    setTimeout(() => {
      wx.hideLoading();
      wx.showModal({
        title: '购买成功',
        content: `您已成功购买${this.data.quantity}张礼品卡，总价值${this.data.cardValue}元`,
        showCancel: false,
        success: (res) => {
          if (res.confirm) {
            // Reset form and switch to My Gift Cards tab
            this.setData({
              activeTab: 0,
              quantity: 1,
              isGift: false,
              friendPhone: ''
            });
            
            // Refresh gift card data
            this.loadGiftCardData();
          }
        }
      });
    }, 1500);
  }
}); 