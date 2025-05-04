// appointment-service.js
Page({
  data: {
    serviceType: "immediate", // 'immediate' or 'appointment'
    selectedCar: "",
    remark: "",
    cars: [],
    service: null,
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
    isLoading: true,
    userId: "",
    storeId: "store001", // 默认店铺ID
  },

  onLoad: function (options) {
    // 服务信息解析
    if (options.service) {
      const service = JSON.parse(options.service);
      this.setData({ service });
    }

    // 初始化日期选择数据
    this.initSimpleDates();

    // 获取用户ID
    this.getUserId();

    // 获取用户车辆列表
    this.getUserVehicles();
  },

  // 获取用户ID
  getUserId: function () {
    wx.cloud
      .callFunction({
        name: "getUserInfo",
      })
      .then((res) => {
        if (res.result && res.result.code === 0) {
          this.setData({
            userId: res.result.data._id,
          });
        }
      })
      .catch((err) => {
        console.error("获取用户信息失败:", err);
      });
  },

  // 获取用户车辆列表
  getUserVehicles: function () {
    this.setData({ isLoading: true });

    wx.cloud
      .callFunction({
        name: "getUserVehicles",
      })
      .then((res) => {
        if (res.result && res.result.code === 0) {
          // 修复：正确获取vehicles数组
          const vehiclesData = res.result.data.vehicles || [];
          console.log("获取到的车辆数据:", vehiclesData);

          const cars = vehiclesData.map((car) => ({
            id: car._id,
            model: car.model,
            plate: car.plate,
            brand: car.brand || "", // 添加品牌字段
          }));

          this.setData({
            cars: cars,
            selectedCar: cars.length > 0 ? cars[0].id : "",
            isLoading: false,
          });
        } else {
          this.setData({ isLoading: false });
          console.error(
            "获取车辆列表失败:",
            res.result ? res.result.msg : "未知错误"
          );
        }
      })
      .catch((err) => {
        this.setData({ isLoading: false });
        console.error("获取车辆列表失败:", err);
      });
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

  // 创建预约
  createAppointment: function (params) {
    wx.showLoading({ title: "创建预约中..." });

    // 构建预约完整日期时间
    const [year, month, day] = params.appointmentDate.split("-");
    const [hour, minute] = params.appointmentTime.split(":");
    const appointmentTime = new Date(year, month - 1, day, hour, minute);

    // 获取用户电话号码
    let userPhone = wx.getStorageSync("userPhone") || "";

    // 如果没有保存的手机号，先尝试获取再创建预约
    if (!userPhone) {
      wx.cloud
        .callFunction({
          name: "getUserInfo",
        })
        .then((res) => {
          if (res.result && res.result.code === 0 && res.result.data.phone) {
            userPhone = res.result.data.phone;
            wx.setStorageSync("userPhone", userPhone);
            this.doCreateAppointment(params, appointmentTime, userPhone);
          } else {
            // 如果云端也没有，使用默认号码并提示用户
            wx.showToast({
              title: "未找到您的联系电话，请稍后在订单中更新",
              icon: "none",
              duration: 2000,
            });
            this.doCreateAppointment(params, appointmentTime, "13800138000");
          }
        })
        .catch((err) => {
          console.error("获取用户信息失败:", err);
          wx.hideLoading();
          wx.showToast({
            title: "获取用户信息失败",
            icon: "none",
          });
        });
    } else {
      // 已有手机号，直接创建预约
      this.doCreateAppointment(params, appointmentTime, userPhone);
    }
  },

  // 实际创建预约的函数
  doCreateAppointment: function (params, appointmentTime, contactPhone) {
    wx.cloud
      .callFunction({
        name: "createAppointment",
        data: {
          userId: this.data.userId,
          vehicleId: params.carId,
          appointmentTime: appointmentTime,
          serviceId: params.serviceId,
          serviceType: params.serviceType,
          duration: this.data.service.duration || 30,
          notes: this.data.remark,
          contactPhone: contactPhone,
        },
      })
      .then((res) => {
        wx.hideLoading();

        if (res.result && res.result.success) {
          // 将预约成功后直接跳转到支付页面
          const appointmentId = res.result.data._id;
          const servicePrice = this.data.service.price;
          const formattedPrice = Number(parseFloat(servicePrice).toFixed(2));

          wx.navigateTo({
            url: `/pages/appointment-payment/appointment-payment?serviceId=${params.serviceId}&carId=${params.carId}&appointmentId=${appointmentId}&serviceType=${params.serviceType}&price=${formattedPrice}`,
          });
        } else {
          wx.showToast({
            title: res.result.message || "创建预约失败",
            icon: "none",
          });
        }
      })
      .catch((err) => {
        wx.hideLoading();
        console.error("创建预约失败:", err);
        wx.showToast({
          title: "创建预约失败，请重试",
          icon: "none",
        });
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

    // 根据服务方式决定下一步
    if (this.data.serviceType === "immediate") {
      // 立即服务直接跳转到支付页面
      // 确保价格是有效的数字，并格式化为2位小数的字符串
      const servicePrice = this.data.service.price;
      const formattedPrice = Number(parseFloat(servicePrice).toFixed(2));

      const params = {
        serviceType: this.data.serviceType,
        carId: this.data.selectedCar,
        serviceId: this.data.service.id || this.data.service._id,
        price: formattedPrice, // 使用格式化后的价格
      };

      console.log("传递价格参数:", formattedPrice);

      wx.navigateTo({
        url: `/pages/appointment-payment/appointment-payment?${this.buildQueryString(params)}`,
      });
    } else {
      // 预约服务 - 创建预约记录
      const params = {
        serviceType: this.data.serviceType,
        carId: this.data.selectedCar,
        serviceId: this.data.service.id || this.data.service._id,
        appointmentDate: this.data.selectedDate,
        appointmentTime: this.data.selectedTime,
      };

      this.createAppointment(params);
    }
  },

  // 构建URL查询字符串
  buildQueryString: function (params) {
    return Object.keys(params)
      .map(
        (key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`
      )
      .join("&");
  },

  onBack() {
    wx.navigateBack();
  },
});
