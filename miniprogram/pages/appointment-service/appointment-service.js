// appointment-service.js
Page({
  data: {
    serviceType: "immediate", // 'immediate' or 'appointment'
    selectedCar: "1",
    remark: "",
    cars: [
      {
        id: "1",
        model: "奥迪A6L",
        plate: "京A12345",
      },
      {
        id: "2",
        model: "宝马3系",
        plate: "京B54321",
      },
    ],
    service: {
      name: "标准洗车",
      duration: "30分钟",
      price: 39.9,
    },
  },

  onLoad: function (options) {
    // If service parameters are passed, update the service info
    if (options.serviceId) {
      // In a real app, you would fetch service details from an API
      // For now, we'll just use the default data
    }
  },

  // 选择服务方式
  selectServiceType: function (e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      serviceType: type,
    });
  },

  // 选择车辆
  selectCar: function (e) {
    const id = e.currentTarget.dataset.id;
    this.setData({
      selectedCar: id,
    });
  },

  // 编辑车辆信息
  editCar: function (e) {
    const id = e.currentTarget.dataset.id;
    const car = this.data.cars.find((car) => car.id === id);

    wx.showToast({
      title: "编辑功能开发中",
      icon: "none",
    });

    // 在实际应用中，可以跳转到编辑车辆页面
    // wx.navigateTo({
    //   url: `/pages/edit-car/edit-car?id=${id}&model=${car.model}&plate=${car.plate}`
    // });
  },

  // 添加新车辆
  addNewCar: function () {
    wx.showToast({
      title: "添加车辆功能开发中",
      icon: "none",
    });

    // 在实际应用中，可以跳转到添加车辆页面
    // wx.navigateTo({
    //   url: '/pages/add-car/add-car'
    // });
  },

  // 备注信息变更
  onRemarkChange: function (e) {
    this.setData({
      remark: e.detail.value,
    });
  },

  // 下单
  placeOrder: function () {
    // 检查是否选择了车辆
    if (!this.data.selectedCar) {
      wx.showToast({
        title: "请选择车辆",
        icon: "none",
      });
      return;
    }

    const car = this.data.cars.find((car) => car.id === this.data.selectedCar);

    // 根据服务方式决定下一步
    if (this.data.serviceType === "immediate") {
      // 立即服务直接跳转到支付页面
      wx.navigateTo({
        url: `/pages/appointment-payment/appointment-payment?serviceType=immediate&carId=${this.data.selectedCar}&servicePrice=${this.data.service.price}`,
      });
    } else {
      // 预约服务跳转到选择时间页面
      wx.navigateTo({
        url: `/pages/appointment-time/appointment-time?serviceType=appointment&carId=${this.data.selectedCar}&servicePrice=${this.data.service.price}`,
      });
    }
  },

  onBack() {
    wx.navigateBack();
  },
});
