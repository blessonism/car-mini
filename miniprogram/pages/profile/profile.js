// pages/profile/profile.js
Page({
  data: {
    userInfo: {
      name: "张先生",
      phone: "138****5678",
      memberLevel: "黄金会员",
      balance: "235.00",
    },
    vehicles: [
      {
        model: "奔驰 C260L",

        plate: "粤B12345",
      },
      {
        model: "奥迪A6L",
        plate: "京A12345",
      },
    ],
    isVehicleModalVisible: false,
    provinces: ["京", "沪", "粤", "浙", "苏", "鲁", "豫", "渝", "川"],
    provinceIndex: 0,
    vehicleNumber: "",
    vehicleModel: "",
    vehicleColor: "",
  },

  onLoad: function (options) {
    // Check login status
    this.checkLoginStatus();
  },

  checkLoginStatus() {
    // In a real app, check the login status from storage or server
    // For demo, we'll assume the user is not logged in
    const isLoggedIn = false;

    if (isLoggedIn) {
      this.getUserInfo();
    }
  },

  getUserInfo() {
    // In a real app, get user info from the server
    // For demo purposes, we'll use mock data
    this.setData({
      userInfo: {
        nickname: "张三",
        avatarUrl: "/assets/icons/profile.png",
        isLoggedIn: true,
        memberLevel: "黄金会员",
        balance: "386.00",
        couponCount: 3,
      },
    });
  },

  login() {
    // In a real app, implement login logic
    // For demo purposes, we'll just update the state
    this.setData({
      "userInfo.isLoggedIn": true,
      "userInfo.nickname": "张三",
      "userInfo.memberLevel": "黄金会员",
      "userInfo.balance": "386.00",
      "userInfo.couponCount": 3,
    });

    wx.showToast({
      title: "登录成功",
      icon: "success",
    });
  },

  addCar() {
    // In a real app, navigate to add car page
    wx.showToast({
      title: "添加车辆功能开发中",
      icon: "none",
    });
  },

  editCar(e) {
    const carId = e.currentTarget.dataset.id;
    // In a real app, navigate to edit car page
    wx.showToast({
      title: "编辑车辆功能开发中",
      icon: "none",
    });
  },

  navigateTo(e) {
    const url = e.currentTarget.dataset.url;
    wx.navigateTo({
      url: url,
    });
  },

  showDevelopingToast() {
    wx.showToast({
      title: "功能开发中",
      icon: "none",
    });
  },

  logout() {
    wx.showModal({
      title: "确认退出",
      content: "您确定要退出登录吗？",
      success: (res) => {
        if (res.confirm) {
          // In actual implementation, would clear user session
          wx.showToast({
            title: "已退出登录",
            icon: "success",
            success: () => {
              setTimeout(() => {
                wx.reLaunch({
                  url: "/pages/index/index",
                });
              }, 1500);
            },
          });
        }
      },
    });
  },

  onShow: function () {
    // 页面显示时，更新自定义tabBar的选中状态
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 3,
      });
    }
  },

  showSettingsToast() {
    this.showToast("设置功能开发中");
  },

  showToast(e) {
    const message = e.currentTarget.dataset.toast || "功能开发中";
    wx.showToast({
      title: message,
      icon: "none",
      duration: 2000,
    });
  },

  showVehicleModal() {
    this.setData({
      isVehicleModalVisible: true,
      vehicleNumber: "",
      vehicleModel: "",
      vehicleColor: "",
      provinceIndex: 0,
    });
  },

  closeVehicleModal() {
    this.setData({
      isVehicleModalVisible: false,
    });
  },

  preventBubble() {
    // Prevent the click event from bubbling up
    return;
  },

  bindProvinceChange(e) {
    this.setData({
      provinceIndex: e.detail.value,
    });
  },

  saveNewVehicle() {
    const {
      provinces,
      provinceIndex,
      vehicleNumber,
      vehicleModel,
      vehicleColor,
    } = this.data;

    // Form validation
    if (!vehicleNumber || !vehicleModel || !vehicleColor) {
      wx.showToast({
        title: "请填写完整的车辆信息",
        icon: "none",
      });
      return;
    }

    // Create new vehicle object
    const newVehicle = {
      model: `${vehicleModel}`,
      plate: `${provinces[provinceIndex]}${vehicleNumber}`,
    };

    // Add to vehicles array
    const vehicles = this.data.vehicles;
    vehicles.push(newVehicle);

    this.setData({
      vehicles,
      isVehicleModalVisible: false,
    });

    // Show success message
    wx.showToast({
      title: "车辆添加成功",
      icon: "success",
    });
  },
});
