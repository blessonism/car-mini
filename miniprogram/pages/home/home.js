Page({
  data: {
    searchValue: '',
    announcements: [
      {
        id: 1,
        title: '五一节假日营业公告',
        content: '尊敬的顾客，五一期间本店正常营业，营业时间为早9:00至晚8:00，预约爆满，建议提前2-3天预约服务。',
        publishTime: '2025-04-25'
      }
    ],
    memberBenefits: [
      {
        id: 1,
        title: '会员专享优惠活动',
        content: '即日起至2025年5月31日，新老会员充值满500元赠送价值100元的精致洗车券一张，充值满1000元可获赠车内除菌消毒服务一次。',
        publishTime: '2025-04-20'
      }
    ],
    hotServices: [
      {
        id: 1,
        title: '标准洗车',
        desc: '外观清洗 + 轮毂清洗',
        price: '39.9',
        iconName: 'car',
        bgColor: 'bg-blue-50',
        iconColor: 'text-blue-500'
      },
      {
        id: 2,
        title: '精致洗车',
        desc: '标准洗车 + 内饰清洁 + 玻璃清洁',
        price: '69.9',
        iconName: 'chart',
        bgColor: 'bg-blue-50',
        iconColor: 'text-blue-500'
      },
      {
        id: 3,
        title: '常规保养',
        desc: '机油更换 + 机滤更换 + 多项检查',
        price: '299起',
        iconName: 'root-list',
        bgColor: 'bg-yellow-50',
        iconColor: 'text-yellow-500'
      }
    ]
  },

  onLoad: function () {
    // 初始化页面数据
  },

  onShow: function () {
    // 页面显示时，更新自定义tabBar的选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 0
      });
    }
  },

  onSearchChange(e) {
    this.setData({
      searchValue: e.detail.value
    });
  },

  onNotificationClick() {
    wx.showToast({
      title: '消息中心即将上线',
      icon: 'none'
    });
  },

  onLocationClick() {
    wx.showToast({
      title: '定位功能即将上线',
      icon: 'none'
    });
  },

  onTabsChange(e) {
    // 从点击事件中获取值
    const value = e.currentTarget.dataset.value;
    this.setData({
      activeTab: value
    });
    
    // 根据选中的标签加载服务
    this.loadServicesByCategory(value);
  },

  loadServicesByCategory(category) {
    // 记录加载的分类
    console.log('Loading services for category:', category);
    
    // 实际应用中这里会发起API请求获取数据
    // 为了演示，我们暂时不改变数据
  },

  onServiceCardClick(e) {
    const serviceId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/service/service?id=${serviceId}`
    });
  },

  // 领取优惠券
  onClaimCoupon() {
    wx.showToast({
      title: '优惠已领取',
      icon: 'success'
    });
  }
}); 