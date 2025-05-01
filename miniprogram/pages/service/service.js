// pages/service/service.js
Page({
  data: {
    searchValue: "",
    isFocused: false,
    activeTab: "0",
    categories: [
      { id: "1", name: "洗车服务", icon: "/assets/icons/hard-washing.png" },
      { id: "2", name: "维修装饰", icon: "/assets/icons/维修.png" },
      { id: "3", name: "保养美容", icon: "/assets/icons/装修.png" },
      { id: "4", name: "轮胎服务", icon: "/assets/icons/轮胎.png" },
    ],
    services: [
      {
        id: "1",
        title: "标准洗车",
        description: "外观清洗 + 轮毂清洗",
        price: "39.9",
        image: "/assets/icons/car-washing.png",
        categoryId: "1",
      },
      {
        id: "2",
        title: "精致洗车",
        description: "标准洗车 + 内饰清洁 + 玻璃清洁",
        price: "69.9",
        image: "/assets/icons/hard-washing.png",
        categoryId: "1",
      },
      {
        id: "3",
        title: "常规保养",
        description: "机油更换 + 机滤更换 + 多项检查",
        price: "299",
        image: "/assets/icons/小保养.png",
        categoryId: "2",
      },
      {
        id: "4",
        title: "轮胎更换",
        description: "四轮更换 + 动平衡调整",
        price: "599",
        image: "/assets/icons/轮胎.png",
        categoryId: "2",
      },
    ],
    filteredServices: [],
    hotServices: [
      {
        id: "1",
        title: "标准洗车",
        tag: "热门",
        duration: 30,
        price: "39.9",
        icon: "/assets/icons/car-washing.png",
        bgColor: "bg-blue",
      },
      {
        id: "2",
        title: "精致洗车",
        tag: "推荐",
        duration: 45,
        price: "59.9",
        icon: "/assets/icons/hard-washing.png",
        bgColor: "bg-lightblue",
      },
      {
        id: "3",
        title: "机油更换",
        tag: "保养",
        duration: 60,
        price: "199",
        icon: "/assets/icons/小保养.png",
        bgColor: "bg-yellow",
      },
      {
        id: "4",
        title: "轮胎更换",
        tag: "安全",
        duration: 90,
        price: "328",
        icon: "/assets/icons/轮胎.png",
        bgColor: "bg-red",
      },
    ],
  },

  onLoad: function (options) {
    // Initialize with all services
    this.filterServicesByCategory("0");
  },

  onTabChange(e) {
    const categoryId = e.detail.value;
    this.setData({
      activeTab: categoryId,
    });
    this.filterServicesByCategory(categoryId);
  },

  filterServicesByCategory(categoryId) {
    let filteredServices = this.data.services;

    if (categoryId !== "0") {
      filteredServices = this.data.services.filter(
        (service) => service.categoryId === categoryId
      );
    }

    this.setData({
      services: filteredServices,
    });
  },

  onCategorySelect(e) {
    const category = e.currentTarget.dataset.category;
    console.log("Selected category:", category);

    // Navigate to category detail
    wx.navigateTo({
      url: `/pages/service/service?categoryId=${category.id}`,
    });
  },

  onServiceSelect(e) {
    const service = e.currentTarget.dataset.service;
    console.log("Selected service:", service);

    // Navigate to appointment time selection
    wx.navigateTo({
      url: `/pages/appointment-service/appointment-service?service=${JSON.stringify(service)}`,
    });
  },

  viewAllCategories() {
    // Navigate to all categories
    console.log("View all categories");
  },

  viewAllServices() {
    // Navigate to all services
    console.log("View all services");
  },

  claimPromotion() {
    // Claim new user promotion
    console.log("Claimed promotion");
    wx.showToast({
      title: "优惠已领取",
      icon: "success",
    });
  },

  onShow: function () {
    // 页面显示时，更新自定义tabBar的选中状态
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 1,
      });
    }
  },

  onSearchChange(e) {
    this.setData({
      searchValue: e.detail.value,
    });
    console.log("Search value:", e.detail.value);
    // Implement search functionality here
  },

  onSearchFocus() {
    this.setData({ isFocused: true });
  },

  onSearchBlur() {
    this.setData({ isFocused: false });
  },
});
