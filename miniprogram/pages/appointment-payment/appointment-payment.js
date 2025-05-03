// pages/appointment-payment/appointment-payment.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 预约信息
    date: "2023-07-20",
    day: "周四",
    time: "14:30",

    // 支付方式选择
    selectedPayment: "wechat",
    paymentMethods: [
      {
        id: "wechat",
        name: "微信支付",
        desc: "微信账号直接支付",
        icon: "wechat.png",
      },
      {
        id: "balance",
        name: "余额支付",
        desc: "账户余额直接支付",
        icon: "wallet-red.png",
        balance: 280.5,
      },
      {
        id: "card",
        name: "会员卡",
        desc: "会员卡余额支付",
        icon: "vip_card.png",
        balance: 500,
      },
    ],

    // 优惠券选择
    selectedCouponIndex: -1,
    coupons: [
      {
        id: 1,
        name: "新用户专享券",
        amount: 50,
        condition: "满300可用",
        validity: "2023-07-01至2023-08-30",
        minAmount: 300,
        disabled: false,
      },
      {
        id: 2,
        name: "全车养护优惠券",
        amount: 30,
        condition: "满200可用",
        validity: "2023-07-15至2023-07-30",
        minAmount: 200,
        disabled: false,
      },
      {
        id: 3,
        name: "会员日专享券",
        amount: 100,
        condition: "满500可用",
        validity: "2023-07-20至2023-07-20",
        minAmount: 500,
        disabled: true,
      },
    ],

    // 价格计算
    servicePrice: 39.9,
    couponDiscount: 5.0,
    memberDiscount: 1.9,
    totalPrice: 33.0,

    // 订单信息
    orderId: "",
    userId: "",
    isLoading: false,
    creatingOrder: false,
    serviceType: "appointment",
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 从上一页获取数据
    if (options) {
      // 如果传入了orderId，说明是直接支付已有订单
      if (options.orderId) {
        this.setData({ orderId: options.orderId });
        // 获取订单详情
        this.getOrderDetail(options.orderId);
      }
      // 预约服务可能直接带有appointmentId
      else if (options.appointmentId) {
        // 直接创建订单
        this.setData({
          creatingOrder: true,
          serviceType: options.serviceType || "appointment",
        });

        // 如果有price，设置价格
        if (options.price) {
          let servicePrice = parseFloat(options.price);
          if (isNaN(servicePrice)) {
            servicePrice = 0;
          }
          servicePrice = Number(servicePrice.toFixed(2));

          this.setData({
            servicePrice: servicePrice,
            couponDiscount: 0,
            memberDiscount: 0,
          });

          this.calculateTotalPrice(servicePrice);
        }

        // 从已有预约创建订单
        this.createOrderFromExistingAppointment(options.appointmentId);
      } else {
        // 从预约页面过来，需要先创建订单
        const { date, day, time, price, serviceId, carId, serviceType } =
          options;
        if (date && day && time) {
          this.setData({
            date,
            day,
            time,
          });
        }

        if (price) {
          // 确保价格是一个有效的数字，使用parseFloat并确保有两位小数
          let servicePrice = parseFloat(price);
          // 处理NaN情况
          if (isNaN(servicePrice)) {
            servicePrice = 0;
          }
          // 确保保留2位小数
          servicePrice = Number(servicePrice.toFixed(2));

          console.log("解析到的服务价格:", servicePrice);

          // 初始设置优惠折扣，在实际环境中应该从用户数据中获取
          this.setData({
            servicePrice: servicePrice,
            couponDiscount: 0, // 默认不使用优惠券
            memberDiscount: 0, // 默认不使用会员折扣
          });

          // 重新计算总价
          this.calculateTotalPrice(servicePrice);
        }

        // 如果有服务ID和车辆ID，则创建临时订单
        if (serviceId && carId) {
          this.setData({ creatingOrder: true });
          this.createTempOrder(serviceId, carId, date, time, serviceType);
        }
      }
    }

    // 获取用户ID
    this.getUserId();
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
        } else {
          console.error(
            "获取用户信息失败:",
            res.result ? res.result.msg : "未知错误"
          );
        }
      })
      .catch((err) => {
        console.error("获取用户信息失败:", err);
      });
  },

  // 获取订单详情
  getOrderDetail: function (orderId) {
    this.setData({ isLoading: true });

    wx.cloud
      .callFunction({
        name: "getUserOrders",
        data: {},
      })
      .then((res) => {
        if (res.result && res.result.success) {
          const order = res.result.data.find((order) => order._id === orderId);

          if (order) {
            console.log("获取到订单数据:", order);

            // 确保所有金额都是数字类型
            const servicePrice = parseFloat(order.totalAmount) || 0;
            const discountAmount = parseFloat(order.discountAmount || 0);
            const actualAmount = parseFloat(order.actualAmount) || 0;

            // 计算会员折扣（总折扣减去优惠券）
            const memberDiscount = Math.max(
              0,
              servicePrice - discountAmount - actualAmount
            );

            console.log("处理后的价格数据:", {
              服务价格: servicePrice,
              优惠券折扣: discountAmount,
              会员折扣: memberDiscount,
              实付金额: actualAmount,
            });

            this.setData({
              servicePrice: servicePrice,
              couponDiscount: discountAmount,
              memberDiscount: memberDiscount,
              totalPrice: actualAmount,
              isLoading: false,
            });
          } else {
            this.setData({ isLoading: false });
            wx.showToast({
              title: "未找到订单信息",
              icon: "none",
            });
          }
        } else {
          this.setData({ isLoading: false });
          wx.showToast({
            title: "获取订单信息失败",
            icon: "none",
          });
        }
      })
      .catch((err) => {
        console.error("获取订单信息失败:", err);
        this.setData({ isLoading: false });
      });
  },

  /**
   * 选择支付方式
   */
  selectPayment: function (e) {
    const payment = e.currentTarget.dataset.payment;

    // 余额检查
    const paymentMethod = this.data.paymentMethods.find(
      (m) => m.id === payment
    );
    if (paymentMethod && paymentMethod.balance !== undefined) {
      // 检查余额是否足够
      if (paymentMethod.balance < this.data.totalPrice) {
        wx.showToast({
          title: `${paymentMethod.name}余额不足`,
          icon: "none",
        });
        return;
      }
    }

    this.setData({ selectedPayment: payment });
  },

  /**
   * 显示优惠券弹窗
   */
  showCouponSelector: function () {
    wx.showToast({
      title: "优惠券选择功能开发中",
      icon: "none",
    });

    // 临时直接设置
    this.setData({
      selectedCouponIndex: 0,
    });
  },

  /**
   * 计算最终价格
   */
  calculateTotalPrice: function (servicePrice) {
    if (!servicePrice && servicePrice !== 0) {
      servicePrice = this.data.servicePrice;
    }

    // 确保所有值都是数字
    const price = parseFloat(servicePrice) || 0;
    const couponDiscount = parseFloat(this.data.couponDiscount) || 0;
    const memberDiscount = parseFloat(this.data.memberDiscount) || 0;

    // 计算总价，确保不为负，并保留2位小数
    const totalPrice = Math.max(
      0,
      price - couponDiscount - memberDiscount
    ).toFixed(2);

    console.log("价格计算:", {
      服务价格: price,
      优惠券折扣: couponDiscount,
      会员折扣: memberDiscount,
      总价: totalPrice,
    });

    this.setData({
      servicePrice: price,
      totalPrice: parseFloat(totalPrice), // 保存为数字类型
    });
  },

  // 获取支付方式
  getPaymentMethod: function () {
    const paymentMap = {
      wechat: "微信支付",
      balance: "余额支付",
      card: "会员卡支付",
    };

    return paymentMap[this.data.selectedPayment] || "微信支付";
  },

  /**
   * 提交支付
   */
  submitPayment: function () {
    // 检查必要参数
    if (!this.data.userId) {
      wx.showToast({
        title: "用户信息获取失败",
        icon: "none",
      });
      return;
    }

    if (!this.data.orderId) {
      // 如果正在创建订单，提示用户等待
      if (this.data.creatingOrder) {
        wx.showToast({
          title: "正在创建订单，请稍候",
          icon: "none",
        });
      } else {
        wx.showToast({
          title: "订单信息不完整",
          icon: "none",
        });
      }
      return;
    }

    const selectedPayment = this.data.selectedPayment;
    const paymentMethod = this.getPaymentMethod();

    // 确保金额是格式化的两位小数字符串
    const amount = parseFloat(this.data.totalPrice).toFixed(2);

    console.log("提交支付金额:", amount);

    wx.showLoading({
      title: "处理支付中",
    });

    // 调用支付云函数
    wx.cloud
      .callFunction({
        name: "createPayment",
        data: {
          userId: this.data.userId,
          orderId: this.data.orderId,
          amount: amount,
          paymentMethod: paymentMethod,
        },
      })
      .then((res) => {
        wx.hideLoading();

        if (res.result && res.result.success) {
          wx.showToast({
            title: "支付成功",
            icon: "success",
          });

          // 支付成功后跳转到订单页
          setTimeout(() => {
            wx.switchTab({
              url: "/pages/order/order",
            });
          }, 1500);
        } else {
          wx.showToast({
            title: res.result.message || "支付失败",
            icon: "none",
          });
        }
      })
      .catch((err) => {
        wx.hideLoading();
        console.error("支付失败:", err);
        wx.showToast({
          title: "支付处理失败",
          icon: "none",
        });
      });
  },

  // 创建临时订单
  createTempOrder: function (serviceId, vehicleId, date, time, serviceType) {
    // 需要等待用户ID获取完成
    const checkUserId = setInterval(() => {
      if (this.data.userId) {
        clearInterval(checkUserId);

        // 处理预约时间，确保立即服务时也使用未来时间
        let appointmentTime;
        if (serviceType === "immediate") {
          // 立即服务使用当前时间加5分钟，确保在未来
          const futureDate = new Date();
          futureDate.setMinutes(futureDate.getMinutes() + 5);
          appointmentTime = futureDate.toISOString();
        } else {
          // 预约服务使用指定日期时间
          appointmentTime =
            date && time ? date + " " + time : new Date().toISOString();
        }

        // 获取用户电话号码，确保有默认值
        const userPhone = wx.getStorageSync("userPhone") || "";

        // 如果没有保存的手机号，尝试从getUserInfo云函数获取
        if (!userPhone) {
          console.log("本地未找到用户电话号码，尝试从云端获取");
          wx.cloud
            .callFunction({
              name: "getUserInfo",
            })
            .then((res) => {
              if (
                res.result &&
                res.result.code === 0 &&
                res.result.data.phone
              ) {
                wx.setStorageSync("userPhone", res.result.data.phone);
                this.createAppointmentWithPhone(
                  serviceId,
                  vehicleId,
                  appointmentTime,
                  serviceType,
                  res.result.data.phone
                );
              } else {
                // 如果云端也没有，使用默认号码并提示用户
                wx.showToast({
                  title: "未找到您的联系电话，请在订单详情中更新",
                  icon: "none",
                  duration: 2000,
                });
                this.createAppointmentWithPhone(
                  serviceId,
                  vehicleId,
                  appointmentTime,
                  serviceType,
                  "13800138000"
                );
              }
            })
            .catch((err) => {
              console.error("获取用户信息失败:", err);
              this.createAppointmentWithPhone(
                serviceId,
                vehicleId,
                appointmentTime,
                serviceType,
                "13800138000"
              );
            });
        } else {
          // 已有手机号，直接创建预约
          this.createAppointmentWithPhone(
            serviceId,
            vehicleId,
            appointmentTime,
            serviceType,
            userPhone
          );
        }
      }
    }, 300);

    // 5秒后如果还没获取到用户ID则超时
    setTimeout(() => {
      if (this.data.creatingOrder) {
        clearInterval(checkUserId);
        this.setData({ creatingOrder: false });
        wx.showToast({
          title: "获取用户信息超时，请重试",
          icon: "none",
        });
      }
    }, 5000);
  },

  // 使用指定电话号码创建预约
  createAppointmentWithPhone: function (
    serviceId,
    vehicleId,
    appointmentTime,
    serviceType,
    contactPhone
  ) {
    console.log(`创建${serviceType}服务预约，时间：${appointmentTime}`);
    console.log(`使用用户ID: ${this.data.userId}`);

    wx.cloud
      .callFunction({
        name: "createAppointment",
        data: {
          userId: this.data.userId,
          vehicleId: vehicleId,
          serviceId: serviceId,
          serviceType: serviceType || "immediate",
          appointmentTime: appointmentTime,
          duration: 30, // 默认30分钟
          contactPhone: contactPhone,
          notes: "",
          // 添加立即服务标志，让云函数跳过预约时间验证
          isImmediate: serviceType === "immediate",
        },
      })
      .then((res) => {
        if (
          (res.result && res.result.success) ||
          (res.result && res.result.code === 0)
        ) {
          const appointmentId = res.result.data._id;
          console.log("预约创建成功，ID:", appointmentId);
          // 创建订单
          return wx.cloud.callFunction({
            name: "createOrderFromAppointment",
            data: {
              appointmentId: appointmentId,
              isAdmin: true, // 临时使用管理员权限创建订单
            },
          });
        } else {
          throw new Error(
            res.result ? res.result.message || res.result.msg : "创建预约失败"
          );
        }
      })
      .then((res) => {
        if (
          (res.result && res.result.success) ||
          (res.result && res.result.code === 0)
        ) {
          // 设置订单ID
          this.setData({
            orderId: res.result.data.orderId,
            creatingOrder: false,
          });
        } else {
          throw new Error(
            res.result ? res.result.message || res.result.msg : "创建订单失败"
          );
        }
      })
      .catch((err) => {
        console.error("创建订单失败:", err);
        this.setData({ creatingOrder: false });
        wx.showToast({
          title: "创建订单失败: " + (err.message || "未知错误"),
          icon: "none",
        });
      });
  },

  // 从已有预约创建订单
  createOrderFromExistingAppointment: function (appointmentId) {
    console.log("从已有预约创建订单，ID:", appointmentId);

    // 保证在有userId的情况下再创建订单
    const checkUserId = setInterval(() => {
      if (this.data.userId) {
        clearInterval(checkUserId);
        console.log("开始创建订单，用户ID:", this.data.userId);

        wx.cloud
          .callFunction({
            name: "createOrderFromAppointment",
            data: {
              appointmentId: appointmentId,
              isAdmin: true, // 临时使用管理员权限创建订单
            },
          })
          .then((res) => {
            console.log("订单创建结果:", res.result);
            if (
              (res.result && res.result.success) ||
              (res.result && res.result.code === 0)
            ) {
              // 设置订单ID
              this.setData({
                orderId: res.result.data.orderId,
                creatingOrder: false,
              });
            } else {
              throw new Error(
                res.result
                  ? res.result.message || res.result.msg
                  : "创建订单失败"
              );
            }
          })
          .catch((err) => {
            console.error("创建订单失败:", err);
            this.setData({ creatingOrder: false });
            wx.showToast({
              title: "创建订单失败: " + (err.message || "未知错误"),
              icon: "none",
            });
          });
      }
    }, 300);

    // 5秒后如果还没获取到用户ID则超时
    setTimeout(() => {
      if (this.data.creatingOrder) {
        clearInterval(checkUserId);
        this.setData({ creatingOrder: false });
        wx.showToast({
          title: "获取用户信息超时，请重试",
          icon: "none",
        });
      }
    }, 5000);
  },
});
