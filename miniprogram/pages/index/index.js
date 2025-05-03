Page({
  data: {
    serviceCategories: [
      {
        title: "常规保养",
        description: "机油更换、滤芯更换等",
      },
      {
        title: "轮胎服务",
        description: "轮胎更换、动平衡等",
      },
      {
        title: "洗车美容",
        description: "外观清洗、内饰清洁",
      },
      {
        title: "故障检测",
        description: "电脑诊断、专业检测",
      },
    ],
  },

  onLoad: function () {
    // 页面加载时的初始化逻辑
    console.log("首页加载完成");
  },

  onAppointmentTap: function () {
    // 跳转到预约服务页面
    wx.navigateTo({
      url: "/pages/appointment-service/appointment-service",
    });
  },

  onMembershipTap: function () {
    // 跳转到会员充值页面
    wx.navigateTo({
      url: "/pages/membership-topup/membership-topup",
    });
  },

  onServiceItemTap: function (e) {
    // 获取点击的服务类别
    const category = e.currentTarget.dataset.category;
    // 跳转到对应服务详情页
    wx.navigateTo({
      url: `/pages/service/service?category=${category}`,
    });
  },

  onViewAllServices: function () {
    // 跳转到服务列表页
    wx.navigateTo({
      url: "/pages/service/service",
    });
  },
});
