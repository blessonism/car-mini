// wallet.js
Page({
  data: {
    accountInfo: {
      balance: 1280.50,
      memberLevel: '黄金',
      memberName: '张三',
      points: 3250
    },
    transactions: [
      {
        id: 'T001',
        title: '洗车服务',
        time: '2023-07-25 14:30',
        amount: 99.00,
        type: 'expense',
        icon: 'car'
      },
      {
        id: 'T002',
        title: '账户充值',
        time: '2023-07-20 10:15',
        amount: 500.00,
        type: 'income',
        icon: 'add-circle'
      },
      {
        id: 'T003',
        title: '轮胎保养',
        time: '2023-07-18 16:45',
        amount: 250.00,
        type: 'expense',
        icon: 'tool'
      },
      {
        id: 'T004',
        title: '积分兑换',
        time: '2023-07-15 09:30',
        amount: 50.00,
        type: 'income',
        icon: 'swap'
      }
    ]
  },

  onLoad: function(options) {
    // 实际项目中应该从服务器获取钱包信息和交易记录
    this.loadWalletInfo();
  },
  
  // 加载钱包信息
  loadWalletInfo: function() {
    wx.showLoading({
      title: '加载中...',
    });
    
    // 模拟API请求延迟
    setTimeout(() => {
      wx.hideLoading();
      // 实际项目中应该是通过API获取数据
    }, 500);
  },
  
  // 导航到充值页面
  navigateToTopup: function() {
    wx.navigateTo({
      url: '/pages/membership-topup/membership-topup'
    });
  },
  
  // 导航到提现页面
  navigateToWithdraw: function() {
    wx.showModal({
      title: '提现',
      content: '提现功能即将上线，敬请期待！',
      showCancel: false
    });
  },
  
  // 导航到交易明细页面
  navigateToTransaction: function() {
    wx.navigateTo({
      url: '/pages/transaction/transaction'
    });
  },
  
  // 导航到会员页面
  navigateToMembership: function() {
    wx.navigateTo({
      url: '/pages/membership/membership'
    });
  },
  
  // 导航到礼品卡页面
  navigateToGiftCard: function() {
    wx.navigateTo({
      url: '/pages/gift-card/gift-card'
    });
  },
  
  // 导航到优惠券页面
  navigateToCoupon: function() {
    wx.navigateTo({
      url: '/pages/coupon/coupon'
    });
  },
  
  // 导航到积分商城页面
  navigateToPoints: function() {
    wx.showModal({
      title: '积分商城',
      content: '积分商城功能即将上线，敬请期待！',
      showCancel: false
    });
  },
  
  // 导航到邀请好友页面
  navigateToInvite: function() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },
  
  // 返回上一页
  onBack: function() {
    wx.navigateBack();
  },
  
  // 分享功能
  onShareAppMessage: function() {
    return {
      title: '智车养护邀请您体验专业汽车服务',
      path: '/pages/home/home?inviter=' + this.data.accountInfo.memberName,
      imageUrl: '/assets/share-image.png' // 实际项目需要替换为真实路径
    };
  }
}) 