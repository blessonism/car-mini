// pages/service/service.js
const auth = require("../../utils/auth");

Page({
  data: {
    searchValue: "",
    isFocused: false,
    activeTab: "0",
    categories: [
      { id: "0", name: "全部", icon: "/assets/icons/维修.png" },
      { id: "1", name: "洗车服务", icon: "/assets/icons/hard-washing.png" },
      { id: "2", name: "保养美容", icon: "/assets/icons/装修.png" },
      { id: "3", name: "轮胎服务", icon: "/assets/icons/轮胎.png" },
    ],
    services: [],
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
    isLoading: true,
    hasInitializedDb: false, // 标记是否已初始化过数据库服务项目
  },

  onLoad: function (options) {
    console.log("===== Service页面 onLoad被调用 =====");
    // 加载服务列表
    this.loadServices();
  },

  // 从云函数获取服务列表
  loadServices: function (category = "") {
    console.log("===== loadServices开始执行，准备调用getServices云函数 =====");
    this.setData({ isLoading: true });

    wx.cloud
      .callFunction({
        name: "getServices",
        data: {
          category: category,
          isActive: true,
        },
      })
      .then((res) => {
        console.log("===== getServices云函数返回数据 =====", res);
        if (
          res.result.success &&
          res.result.data &&
          res.result.data.length > 0
        ) {
          // 处理返回的服务数据，添加必要的UI属性
          const services = res.result.data.map((service) => ({
            id: service._id,
            title: service.name,
            description: service.description,
            price: service.price,
            duration: service.duration,
            image:
              service.coverImage ||
              this.getCategoryDefaultIcon(service.category),
            categoryId: this.getCategoryIdByName(service.category),
            bgColor: this.getRandomBgColor(), // 随机背景色
            tag: service.category, // 使用分类作为标签
          }));

          this.setData({
            services: services,
            filteredServices: services,
            isLoading: false,
          });
        } else {
          console.log(
            "===== 从云函数未获取到服务数据，准备初始化示例数据 ====="
          );
          // 如果数据库中没有服务项目，并且还没有初始化过，则尝试初始化示例服务项目
          if (!this.data.hasInitializedDb) {
            this.initializeServiceData();
          } else {
            // 显示预设的热门服务
            this.setData({
              services: this.data.hotServices,
              filteredServices: this.data.hotServices,
              isLoading: false,
            });

            wx.showToast({
              title: "使用本地服务数据",
              icon: "none",
            });
          }
        }
      })
      .catch((err) => {
        console.error("===== 获取服务列表失败 =====", err);
        // 显示预设的热门服务作为后备
        this.setData({
          services: this.data.hotServices,
          filteredServices: this.data.hotServices,
          isLoading: false,
        });

        wx.showToast({
          title: "获取服务列表失败，使用本地数据",
          icon: "none",
        });
      });
  },

  // 初始化服务数据到数据库
  initializeServiceData: function () {
    console.log("===== 开始初始化服务数据到数据库 =====");
    this.setData({ hasInitializedDb: true });

    const sampleServices = [
      {
        name: "标准洗车",
        description: "外部车身清洗，包括玻璃、轮毂清洁",
        category: "洗车服务",
        price: "39.9",
        duration: 30,
        coverImage: "/assets/icons/car-washing.png",
        isActive: true,
        sortOrder: 1,
      },
      {
        name: "精致洗车",
        description: "外部车身清洗、内饰吸尘、玻璃清洁、轮毂清洁",
        category: "洗车服务",
        price: "59.9",
        duration: 45,
        coverImage: "/assets/icons/hard-washing.png",
        isActive: true,
        sortOrder: 2,
      },
      {
        name: "机油更换",
        description: "更换优质机油，保证发动机正常运行",
        category: "保养美容",
        price: "199",
        duration: 60,
        coverImage: "/assets/icons/小保养.png",
        isActive: true,
        sortOrder: 3,
      },
      {
        name: "轮胎更换",
        description: "专业更换轮胎，确保安全驾驶",
        category: "轮胎服务",
        price: "328",
        duration: 90,
        coverImage: "/assets/icons/轮胎.png",
        isActive: true,
        sortOrder: 4,
      },
    ];

    // 批量添加示例服务到数据库
    const addPromises = sampleServices.map((service) => {
      console.log("添加服务:", service.name);
      return wx.cloud.callFunction({
        name: "addService",
        data: service,
      });
    });

    Promise.all(addPromises)
      .then((results) => {
        console.log("===== 成功初始化示例服务 =====", results);
        // 重新加载服务列表
        this.loadServices();
      })
      .catch((err) => {
        console.error("===== 初始化示例服务失败 =====", err);
        // 显示预设的热门服务作为后备
        this.setData({
          services: this.data.hotServices,
          filteredServices: this.data.hotServices,
          isLoading: false,
        });
      });
  },

  // 获取随机背景色类名
  getRandomBgColor: function () {
    const colors = [
      "bg-blue",
      "bg-lightblue",
      "bg-yellow",
      "bg-red",
      "bg-green",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  },

  // 根据分类名称获取分类ID
  getCategoryIdByName: function (categoryName) {
    const categoryMap = {
      洗车服务: "1",
      保养美容: "2",
      轮胎服务: "3",
    };
    return categoryMap[categoryName] || "0";
  },

  // 获取分类默认图标
  getCategoryDefaultIcon: function (categoryName) {
    const iconMap = {
      洗车服务: "/assets/icons/car-washing.png",
      保养美容: "/assets/icons/装修.png",
      轮胎服务: "/assets/icons/轮胎.png",
    };
    return iconMap[categoryName] || "/assets/icons/维修.png";
  },

  onTabChange(e) {
    const categoryId = e.detail.value;
    this.setData({
      activeTab: categoryId,
    });
    this.filterServicesByCategory(categoryId);
  },

  filterServicesByCategory(categoryId) {
    if (categoryId === "0") {
      // 加载所有服务
      this.setData({
        filteredServices: this.data.services,
      });
    } else {
      // 筛选指定分类的服务
      const filteredServices = this.data.services.filter(
        (service) => service.categoryId === categoryId
      );
      this.setData({
        filteredServices: filteredServices,
      });
    }
  },

  // 根据分类ID获取分类名称
  getCategoryNameById: function (categoryId) {
    const categoryMap = {
      1: "洗车服务",
      2: "保养美容",
      3: "轮胎服务",
    };
    return categoryMap[categoryId] || "";
  },

  onCategorySelect(e) {
    const category = e.currentTarget.dataset.category;
    console.log("Selected category:", category);

    // 切换到对应的标签页
    this.setData({ activeTab: category.id });
    this.filterServicesByCategory(category.id);
  },

  // 检查用户是否已登录，如未登录则显示登录提示
  checkLoginStatus() {
    if (!auth.checkLoginState()) {
      wx.showModal({
        title: "提示",
        content: "请先登录后再选择服务",
        confirmText: "去登录",
        cancelText: "取消",
        success: (res) => {
          if (res.confirm) {
            // 跳转到个人中心页面进行登录
            wx.switchTab({
              url: "/pages/profile/profile",
            });
          }
        },
      });
      return false;
    }
    return true;
  },

  onServiceSelect(e) {
    const service = e.currentTarget.dataset.service;
    console.log("Selected service:", service);

    // 检查用户是否已登录
    if (!this.checkLoginStatus()) {
      return;
    }

    // 已登录，继续前往服务预约页面
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

  // 对优惠券领取也需要检查登录状态
  claimPromotion() {
    // 检查用户是否已登录
    if (!this.checkLoginStatus()) {
      return;
    }

    // 已登录，处理领取优惠
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

    // 实现搜索功能
    if (e.detail.value) {
      const filteredServices = this.data.services.filter(
        (service) =>
          service.title.toLowerCase().includes(e.detail.value.toLowerCase()) ||
          (service.description &&
            service.description
              .toLowerCase()
              .includes(e.detail.value.toLowerCase()))
      );
      this.setData({ filteredServices });
    } else {
      this.filterServicesByCategory(this.data.activeTab);
    }
  },

  onSearchFocus() {
    this.setData({ isFocused: true });
  },

  onSearchBlur() {
    this.setData({ isFocused: false });
  },
});
