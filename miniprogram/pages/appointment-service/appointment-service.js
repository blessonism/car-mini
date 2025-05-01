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
    // 简化的日期选择（今天、明天、后天）
    simpleDates: [],
    selectedDate: null,
    // 时间段相关数据
    timeSlots: [
      { time: "09:00", isBooked: false },
      { time: "10:00", isBooked: false },
      { time: "11:00", isBooked: false },
      { time: "11:30", isBooked: true },
      { time: "14:00", isBooked: false },
      { time: "14:30", isBooked: true },
      { time: "15:30", isBooked: false },
      { time: "16:00", isBooked: false },
      { time: "16:30", isBooked: false },
    ],
    selectedTime: null,
  },

  onLoad: function (options) {
    // 初始化日期选择数据
    this.initSimpleDates();
  },

  // 初始化简化的日期选择（今天、明天、后天）
  initSimpleDates: function () {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const afterTomorrow = new Date(today);
    afterTomorrow.setDate(afterTomorrow.getDate() + 2);

    // 格式化日期
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return {
        date: `${year}-${month}-${day}`,
        dayValue: `${month}月${day}日`,
      };
    };

    const simpleDates = [
      formatDate(today),
      formatDate(tomorrow),
      formatDate(afterTomorrow),
    ];

    this.setData({
      simpleDates,
    });
  },

  // 选择日期
  selectDate: function (e) {
    const date = e.currentTarget.dataset.date;

    this.setData({
      selectedDate: date,
    });
  },

  // 选择时间段
  selectTime: function (e) {
    const time = e.currentTarget.dataset.time;
    const booked = e.currentTarget.dataset.booked;

    if (booked) {
      return; // 已约满的时间段不处理
    }

    this.setData({
      selectedTime: time,
    });
  },

  // 选择服务方式
  selectServiceType: function (e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      serviceType: type,
      // 重置日期和时间选择
      selectedDate: null,
      selectedTime: null,
    });

    console.log("服务类型已切换为:", type);

    // 如果选择预约服务，确保日期数据已初始化
    if (type === "appointment") {
      this.initSimpleDates();
    }
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

    // 检查预约服务时是否选择了日期和时间
    if (this.data.serviceType === "appointment") {
      if (!this.data.selectedDate) {
        wx.showToast({
          title: "请选择预约日期",
          icon: "none",
        });
        return;
      }

      if (!this.data.selectedTime) {
        wx.showToast({
          title: "请选择预约时间",
          icon: "none",
        });
        return;
      }
    }

    const car = this.data.cars.find((car) => car.id === this.data.selectedCar);

    // 构建URL参数
    let params = `serviceType=${this.data.serviceType}&carId=${this.data.selectedCar}&servicePrice=${this.data.service.price}`;

    // 如果是预约服务，添加日期和时间参数
    if (this.data.serviceType === "appointment") {
      params += `&appointmentDate=${this.data.selectedDate}&appointmentTime=${this.data.selectedTime}`;
    }

    // 根据服务方式决定下一步
    if (this.data.serviceType === "immediate") {
      // 立即服务直接跳转到支付页面
      wx.navigateTo({
        url: `/pages/appointment-payment/appointment-payment?${params}`,
      });
    } else {
      // 预约服务跳转到信息确认页面
      wx.navigateTo({
        url: `/pages/appointment-info/appointment-info?${params}`,
      });
    }
  },

  onBack() {
    wx.navigateBack();
  },
});
