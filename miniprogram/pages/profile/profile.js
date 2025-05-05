// pages/profile/profile.js
const auth = require("../../utils/auth");

Page({
  data: {
    userInfo: null,
    isLoggedIn: false,
    vehicles: [],
    isRefreshing: false, // 刷新状态标志
    isVehicleModalVisible: false,
    provinces: ["京", "沪", "粤", "浙", "苏", "鲁", "豫", "渝", "川"],
    provinceIndex: 0,
    vehicleNumber: "",
    vehicleBrand: "",
    vehicleModel: "",
    vehicleColor: "",
    isEditingVehicle: false,
    currentEditingVehicleId: "", // 改为存储车辆ID而非索引
    isUserInfoFormVisible: false,
    // 用户信息表单数据
    userInfoForm: {
      phone: "",
      name: "",
      gender: "1", // 默认先生
      plateNumber: "",
      brand: "",
      model: "",
      color: "",
    },
    // 表单错误信息
    errors: {},
  },

  onLoad: function (options) {
    // 初始化云环境
    if (!wx.cloud) {
      console.error("请使用 2.2.3 或以上的基础库以使用云能力");
    } else {
      wx.cloud.init({
        env: "cloud1-0grrc4znc15e5fde", // 替换为你的云环境ID
        traceUser: true,
      });
    }

    // 检查登录状态
    this.checkLoginStatus();
  },

  onShow: function () {
    // 页面显示时，更新自定义tabBar的选中状态
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 3,
      });
    }

    // 检查登录状态，可能已在其他页面完成登录
    this.checkLoginStatus();

    // 如果已登录，但没有加载用户和车辆信息，则加载一次
    if (this.data.isLoggedIn) {
      // 检查是否有已保存的用户信息
      if (!this.data.userInfo) {
        this.loadUserInfo();
      }

      // 检查是否有已保存的车辆信息
      if (!this.data.vehicles || this.data.vehicles.length === 0) {
        this.loadVehicleInfo();
      }
    } else {
      // 检查是否有部分完成的用户信息，如果有，显示完善信息表单
      const partialUserInfo = auth.getPartialUserInfo();
      if (partialUserInfo) {
        this.setData({
          userInfo: partialUserInfo,
        });
        this.showUserInfoForm();
      }
    }
  },

  // 加载用户基本信息（从缓存优先，必要时才从云端获取）
  loadUserInfo: function () {
    // 尝试从缓存加载
    const cachedUserInfo = auth.getStoredUserInfo();
    if (cachedUserInfo) {
      this.setData({ userInfo: cachedUserInfo });
    } else {
      // 如果缓存不存在，则从云端加载
      this.refreshUserInfo(true);
    }
  },

  // 加载车辆信息（从缓存优先，必要时才从云端获取）
  loadVehicleInfo: function () {
    // 尝试从缓存加载
    const cachedVehicles = auth.getStoredVehicles();
    if (cachedVehicles) {
      this.setData({ vehicles: cachedVehicles });
    } else {
      // 如果缓存不存在，则从云端加载
      this.loadUserVehicles(true);
    }
  },

  // 加载用户的车辆信息
  loadUserVehicles(forceRefresh = false) {
    // 如果不是强制刷新，且不需要刷新车辆信息，则使用缓存
    if (!forceRefresh && !auth.shouldRefreshVehicles()) {
      const vehicles = auth.getStoredVehicles();
      if (vehicles && vehicles.length > 0) {
        this.setData({ vehicles });
        return Promise.resolve(vehicles.length > 0);
      }
    }

    wx.showLoading({ title: "加载车辆信息" });

    // 返回Promise表示是否有车辆
    return new Promise((resolve) => {
      // 调用云函数获取用户车辆
      wx.cloud
        .callFunction({
          name: "getUserVehicles",
        })
        .then((res) => {
          if (res.result && res.result.code === 0) {
            const vehicles = res.result.data.vehicles || [];
            // 保存到本地状态
            this.setData({
              vehicles: vehicles,
            });

            // 保存到缓存
            auth.saveVehiclesInfo(vehicles);

            wx.hideLoading();
            resolve(vehicles.length > 0);
          } else {
            console.error("获取车辆信息失败:", res);
            wx.hideLoading();
            resolve(false);
          }
        })
        .catch((err) => {
          console.error("获取车辆信息失败:", err);
          wx.hideLoading();
          resolve(false);
        });
    });
  },

  checkLoginStatus() {
    const isLoggedIn = auth.checkLoginState();

    // 如果登录状态发生变化，才更新数据
    if (isLoggedIn !== this.data.isLoggedIn) {
      this.setData({ isLoggedIn });

      if (isLoggedIn) {
        // 获取存储的用户信息
        this.loadUserInfo();
        // 获取存储的车辆信息
        this.loadVehicleInfo();
      } else {
        // 如果没有登录，清除之前可能存在的用户数据
        this.setData({
          userInfo: null,
          vehicles: [],
        });

        // 检查是否有部分完成的登录信息
        const partialUserInfo = auth.getPartialUserInfo();
        if (partialUserInfo) {
          this.setData({
            userInfo: partialUserInfo,
          });
        }
      }
    }
  },

  // 下拉刷新处理函数
  onPullDownRefresh: function () {
    if (!this.data.isLoggedIn || this.data.isRefreshing) {
      wx.stopPullDownRefresh();
      return;
    }

    this.setData({ isRefreshing: true });

    // 同时刷新用户信息和车辆信息
    Promise.all([this.refreshUserInfo(true), this.loadUserVehicles(true)])
      .then(() => {
        this.setData({ isRefreshing: false });
        wx.stopPullDownRefresh();
        wx.showToast({ title: "刷新成功", icon: "success" });
      })
      .catch((err) => {
        this.setData({ isRefreshing: false });
        wx.stopPullDownRefresh();
        wx.showToast({ title: "刷新失败", icon: "none" });
        console.error("刷新数据失败:", err);
      });
  },

  refreshUserInfo(forceRefresh = false) {
    // 避免不必要的刷新
    if (!forceRefresh && !auth.shouldRefreshUserInfo()) {
      return Promise.resolve(this.data.userInfo);
    }

    wx.showLoading({ title: "加载中" });

    return auth
      .refreshUserInfo(forceRefresh)
      .then((userInfo) => {
        this.setData({
          userInfo,
        });
        wx.hideLoading();
        return userInfo;
      })
      .catch((err) => {
        console.error("刷新用户信息失败", err);
        wx.hideLoading();
        wx.showToast({
          title: "获取信息失败",
          icon: "none",
        });
        throw err;
      });
  },

  // 微信登录
  handleWxLogin() {
    wx.showLoading({ title: "登录中" });

    console.log("开始微信登录流程");

    // 获取用户信息
    auth
      .getUserProfile()
      .then((userInfo) => {
        console.log("获取到用户信息:", userInfo);
        // 执行云函数登录
        return auth.cloudLogin(userInfo);
      })
      .then((userInfo) => {
        console.log("云函数登录成功，用户信息:", userInfo);

        // 检查用户是否已完善个人信息
        if (
          !userInfo.phone ||
          !userInfo.name ||
          !(this.data.vehicles && this.data.vehicles.length > 0)
        ) {
          // 检查是否需要加载车辆信息
          const needToCheckVehicles =
            this.data.vehicles && this.data.vehicles.length === 0;

          if (needToCheckVehicles) {
            // 尝试加载车辆信息，看是否有记录
            this.loadUserVehicles(true).then((hasVehicles) => {
              if (!hasVehicles || !userInfo.phone || !userInfo.name) {
                // 仍然需要完善信息
                this.promptForUserInfo(userInfo);
              } else {
                // 信息已完整，直接登录成功
                this.completeLogin(userInfo);
              }
            });
          } else {
            // 明确缺少基本信息，直接提示完善
            this.promptForUserInfo(userInfo);
          }
        } else {
          // 用户信息完整，登录成功
          this.completeLogin(userInfo);
        }
      })
      .catch((err) => {
        console.error("登录失败", err);
        wx.hideLoading();
        wx.showToast({
          title: "登录失败，请重试",
          icon: "none",
        });
      });
  },

  // 提示用户完善信息
  promptForUserInfo(userInfo) {
    // 保存部分用户信息，但不设置登录状态为成功
    auth.savePartialUserInfo(userInfo);
    this.setData({
      userInfo,
    });

    wx.hideLoading();

    // 直接显示信息完善表单
    this.showUserInfoForm();

    // 提示用户需要完善信息
    wx.showModal({
      title: "完善信息",
      content: "请完善个人资料和车辆信息以完成登录",
      showCancel: false,
      confirmText: "我知道了",
    });
  },

  // 完成登录流程
  completeLogin(userInfo) {
    auth.saveUserInfo(userInfo);
    this.setData({
      isLoggedIn: true,
      userInfo,
    });

    // 登录成功后，刷新一次车辆信息
    this.loadUserVehicles(true);

    wx.hideLoading();
    wx.showToast({
      title: "登录成功",
      icon: "success",
    });
  },

  // 显示用户信息表单
  showUserInfoForm() {
    // 预填充可能已存在的用户信息
    let userInfo = this.data.userInfo;
    if (!userInfo) {
      // 如果当前没有用户信息，尝试从部分用户信息中获取
      userInfo = auth.getPartialUserInfo();
      if (userInfo) {
        this.setData({ userInfo });
      }
    }

    if (userInfo) {
      const { phone, name, gender } = userInfo;
      this.setData({
        "userInfoForm.phone": phone || "",
        "userInfoForm.name": name || userInfo.nickName || "",
        "userInfoForm.gender": gender || "1",
      });
    }

    this.setData({
      isUserInfoFormVisible: true,
    });
  },

  // 关闭用户信息表单
  closeUserInfoForm() {
    // 检查用户是否已有基本信息和车辆信息
    if (
      this.data.userInfo &&
      this.data.userInfo.phone &&
      this.data.vehicles &&
      this.data.vehicles.length > 0
    ) {
      this.setData({
        isUserInfoFormVisible: false,
      });
    } else {
      // 如果没有基本信息或车辆信息，提示用户必须完成信息填写
      wx.showModal({
        title: "提示",
        content:
          "完善个人和车辆信息是必要步骤，为了提供更好的服务，请填写完整信息",
        showCancel: false,
        confirmText: "我知道了",
      });
    }
  },

  // 输入验证函数
  phoneInput(e) {
    const phone = e.detail.value;
    const errors = { ...this.data.errors };

    if (phone && !/^1\d{10}$/.test(phone)) {
      errors.phone = "请输入正确的11位手机号码";
    } else {
      delete errors.phone;
    }

    this.setData({
      "userInfoForm.phone": phone,
      errors,
    });
  },

  nameInput(e) {
    const name = e.detail.value;
    const errors = { ...this.data.errors };

    if (name && name.length < 2) {
      errors.name = "姓名至少需要2个字符";
    } else {
      delete errors.name;
    }

    this.setData({
      "userInfoForm.name": name,
      errors,
    });
  },

  genderChange(e) {
    this.setData({
      "userInfoForm.gender": e.detail.value,
    });
  },

  plateNumberInput(e) {
    const plateNumber = e.detail.value.toUpperCase();
    const errors = { ...this.data.errors };

    if (!plateNumber || plateNumber.length < 5) {
      errors.plateNumber = "请输入正确的车牌号";
    } else {
      delete errors.plateNumber;
    }

    this.setData({
      "userInfoForm.plateNumber": plateNumber,
      errors,
    });
  },

  brandInput(e) {
    const brand = e.detail.value;
    const errors = { ...this.data.errors };

    if (!brand || brand.length < 2) {
      errors.brand = "请输入有效的车辆品牌";
    } else {
      delete errors.brand;
    }

    this.setData({
      "userInfoForm.brand": brand,
      errors,
    });
  },

  modelInput(e) {
    const model = e.detail.value;
    const errors = { ...this.data.errors };

    if (!model || model.length < 2) {
      errors.model = "请输入有效的车型/型号";
    } else {
      delete errors.model;
    }

    this.setData({
      "userInfoForm.model": model,
      errors,
    });
  },

  colorInput(e) {
    const color = e.detail.value;
    const errors = { ...this.data.errors };

    if (!color) {
      errors.color = "请输入车身颜色";
    } else {
      delete errors.color;
    }

    this.setData({
      "userInfoForm.color": e.detail.value,
      errors,
    });
  },

  // 提交用户信息表单
  submitUserInfo(e) {
    const formValues = e.detail.value;
    const { phone, name, gender, plateNumber, brand, model, color } =
      formValues;

    // 验证必填字段
    const errors = {};

    if (!phone || phone.length !== 11) {
      errors.phone = "请输入正确的11位手机号码";
    }

    if (!name || name.length < 2) {
      errors.name = "请输入您的姓名/昵称，至少2个字符";
    }

    if (!plateNumber || plateNumber.length < 5) {
      errors.plateNumber = "请输入完整的车牌号";
    }

    if (!brand) {
      errors.brand = "请输入车辆品牌";
    }

    if (!model) {
      errors.model = "请输入车型/型号";
    }

    if (!color) {
      errors.color = "请输入车身颜色";
    }

    // 如果有错误，显示错误并阻止提交
    if (Object.keys(errors).length > 0) {
      this.setData({ errors });
      wx.showToast({
        title: "请完善必填信息",
        icon: "none",
      });
      return;
    }

    // 显示加载提示
    wx.showLoading({ title: "保存中" });

    // 更新用户基本信息
    const userInfoData = {
      phone,
      name,
      gender,
    };

    this.updateUserInfo(userInfoData)
      .then(() => {
        // 构建车辆信息
        const vehicleInfo = {
          plate: `${this.data.provinces[this.data.provinceIndex]}${plateNumber.toUpperCase()}`,
          brand,
          model,
          color: color || "未知",
        };
        return this.addUserVehicle(vehicleInfo);
      })
      .then(() => {
        // 现在信息已完善，将用户标记为登录状态
        this.setData({
          isLoggedIn: true,
          isUserInfoFormVisible: false,
        });

        // 刷新用户信息
        this.refreshUserInfo();
        this.loadUserVehicles(); // 刷新车辆信息

        wx.hideLoading();
        wx.showToast({
          title: "登录成功",
          icon: "success",
        });
      })
      .catch((err) => {
        wx.hideLoading();
        console.error("保存用户信息失败", err);
        wx.showToast({
          title: "保存失败，请重试",
          icon: "none",
        });
      });
  },

  // 更新用户基本信息
  updateUserInfo(userInfo) {
    wx.showLoading({ title: "更新信息中..." });

    // Return the promise chain
    return new Promise((resolve, reject) => {
      // Wrap in a new Promise
      wx.cloud
        .callFunction({
          name: "updateUserInfo",
          data: userInfo,
        })
        .then((res) => {
          wx.hideLoading();
          if (res.result && res.result.code === 0) {
            // Cloud function succeeded
            const updatedUserInfo = {
              ...this.data.userInfo, // Use existing data as base
              ...userInfo, // Apply updates
            };

            // Update local state and cache
            auth.saveUserInfo(updatedUserInfo); // Save complete info
            this.setData({
              userInfo: updatedUserInfo,
              isLoggedIn: true, // Ensure loggedIn state is set
            });

            // Don't show toast here, let submitUserInfo handle final success message
            // wx.showToast({ title: "更新成功", icon: "success" });

            this.closeUserInfoForm(); // Close form on success
            resolve(updatedUserInfo); // Resolve the promise with updated info
          } else {
            // Cloud function returned an error code
            const errorMsg = res.result ? res.result.msg : "更新失败";
            console.error("更新用户信息云函数返回失败:", errorMsg, res);
            wx.showToast({ title: errorMsg, icon: "none" });
            reject(new Error(errorMsg)); // Reject the promise
          }
        })
        .catch((err) => {
          // Network or other callFunction error
          wx.hideLoading();
          console.error("调用更新用户信息云函数失败:", err);
          wx.showToast({ title: "更新失败，请重试", icon: "none" });
          reject(err); // Reject the promise
        });
    });
  },

  // 退出登录
  logout() {
    wx.showModal({
      title: "确认退出",
      content: "您确定要退出登录吗？",
      success: (res) => {
        if (res.confirm) {
          auth.logout();

          this.setData({
            isLoggedIn: false,
            userInfo: null,
            vehicles: [],
          });

          wx.showToast({
            title: "已退出登录",
            icon: "success",
          });
        }
      },
    });
  },

  // 添加车辆相关
  showVehicleModal() {
    // 必须登录才能添加车辆
    if (!this.data.isLoggedIn) {
      wx.showToast({
        title: "请先登录",
        icon: "none",
      });
      return;
    }

    this.setData({
      isVehicleModalVisible: true,
      vehicleNumber: "",
      vehicleBrand: "",
      vehicleModel: "",
      vehicleColor: "",
      provinceIndex: 0,
      isEditingVehicle: false,
      currentEditingVehicleId: "",
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

  preventTouchMove() {
    return false;
  },

  bindProvinceChange(e) {
    this.setData({
      provinceIndex: e.detail.value,
    });
  },

  // 车辆输入处理函数
  inputVehicleNumber(e) {
    this.setData({
      vehicleNumber: e.detail.value.toUpperCase(),
    });
  },

  inputVehicleBrand(e) {
    this.setData({
      vehicleBrand: e.detail.value,
    });
  },

  inputVehicleModel(e) {
    this.setData({
      vehicleModel: e.detail.value,
    });
  },

  inputVehicleColor(e) {
    this.setData({
      vehicleColor: e.detail.value,
    });
  },

  saveNewVehicle() {
    const {
      provinces,
      provinceIndex,
      vehicleNumber,
      vehicleBrand,
      vehicleModel,
      vehicleColor,
      isEditingVehicle,
      currentEditingVehicleId,
    } = this.data;

    // 表单验证
    if (!vehicleNumber || !vehicleModel || !vehicleColor || !vehicleBrand) {
      wx.showToast({
        title: "请填写完整的车辆信息",
        icon: "none",
      });
      return;
    }

    // 创建新车辆对象，确保车牌号转为大写
    const newVehicle = {
      model: vehicleModel,
      color: vehicleColor,
      plate: `${provinces[provinceIndex]}${vehicleNumber.toUpperCase()}`,
      brand: vehicleBrand,
    };

    wx.showLoading({ title: "保存中" });

    // 调用云函数添加/更新车辆
    wx.cloud
      .callFunction({
        name: "updateUserVehicles",
        data: {
          action: isEditingVehicle ? "update" : "add",
          vehicle: newVehicle,
          vehicleId: isEditingVehicle ? currentEditingVehicleId : "",
        },
      })
      .then((res) => {
        if (res.result && res.result.code === 0) {
          // 更新本地数据
          this.setData({
            vehicles: res.result.data.vehicles || [],
            isVehicleModalVisible: false,
            isEditingVehicle: false,
            currentEditingVehicleId: "",
          });

          wx.hideLoading();
          wx.showToast({
            title: isEditingVehicle ? "车辆更新成功" : "车辆添加成功",
            icon: "success",
          });
        } else {
          wx.hideLoading();
          wx.showToast({
            title: res.result.msg || "操作失败",
            icon: "none",
          });
        }
      })
      .catch((err) => {
        wx.hideLoading();
        console.error("车辆操作失败", err);
        wx.showToast({
          title: "操作失败，请重试",
          icon: "none",
        });
      });
  },

  // 添加用户车辆
  addUserVehicle(vehicle) {
    wx.showLoading({ title: "添加车辆中..." });
    wx.cloud
      .callFunction({
        name: "updateUserVehicles",
        data: {
          vehicle: vehicle,
          action: "add",
        },
      })
      .then((res) => {
        wx.hideLoading();
        if (res.result && res.result.code === 0) {
          wx.showToast({
            title: "添加车辆成功",
            icon: "success",
          });

          // 更新本地车辆列表
          const updatedVehicles = [...this.data.vehicles, res.result.data];
          this.setData({
            vehicles: updatedVehicles,
            // 清空表单数据
            vehicleNumber: "",
            vehicleBrand: "",
            vehicleModel: "",
            vehicleColor: "",
          });

          // 保存到缓存
          auth.saveVehiclesInfo(updatedVehicles);

          // 关闭弹窗
          this.closeVehicleModal();
        } else {
          wx.showToast({
            title: res.result.msg || "添加失败",
            icon: "none",
          });
        }
      })
      .catch((err) => {
        wx.hideLoading();
        console.error("添加车辆失败:", err);
        wx.showToast({
          title: "添加失败，请重试",
          icon: "none",
        });
      });
  },

  // 编辑车辆
  editVehicle(e) {
    const index = e.currentTarget.dataset.index;
    const vehicles = this.data.vehicles || [];
    const vehicle = vehicles[index];

    if (!vehicle) return;

    // 解析车牌号，提取省份和号码
    const plate = vehicle.plate || "";
    let province = plate.charAt(0);
    let number = plate.substring(1);

    // 查找省份索引
    let provinceIndex = this.data.provinces.indexOf(province);
    if (provinceIndex === -1) provinceIndex = 0;

    this.setData({
      isEditingVehicle: true,
      currentEditingVehicleId: vehicle._id,
      isVehicleModalVisible: true,
      provinceIndex,
      vehicleNumber: number.toUpperCase(),
      vehicleBrand: vehicle.brand || "",
      vehicleModel: vehicle.model || "",
      vehicleColor: vehicle.color || "",
    });
  },

  // 删除车辆
  deleteVehicle(e) {
    const index = e.currentTarget.dataset.index;
    const vehicles = this.data.vehicles || [];
    const vehicle = vehicles[index];

    if (!vehicle) return;

    wx.showModal({
      title: "确认删除",
      content: `确定要删除车辆 ${vehicle.plate} 吗？`,
      success: (res) => {
        if (res.confirm) {
          this.removeVehicle(vehicle._id);
        }
      },
    });
  },

  // 从服务器删除车辆
  removeVehicle(vehicleId) {
    wx.showLoading({ title: "删除中..." });

    wx.cloud
      .callFunction({
        name: "updateUserVehicles",
        data: {
          vehicleId: vehicleId,
          action: "remove",
        },
      })
      .then((res) => {
        wx.hideLoading();
        if (res.result && res.result.code === 0) {
          // 从本地车辆列表中移除
          const updatedVehicles = this.data.vehicles.filter(
            (vehicle) => vehicle._id !== vehicleId
          );

          this.setData({
            vehicles: updatedVehicles,
          });

          // 保存到缓存
          auth.saveVehiclesInfo(updatedVehicles);

          wx.showToast({
            title: "删除成功",
            icon: "success",
          });
        } else {
          wx.showToast({
            title: res.result.msg || "删除失败",
            icon: "none",
          });
        }
      })
      .catch((err) => {
        wx.hideLoading();
        console.error("删除车辆失败:", err);
        wx.showToast({
          title: "删除失败，请重试",
          icon: "none",
        });
      });
  },

  navigateTo(e) {
    const url = e.currentTarget.dataset.url;
    wx.navigateTo({
      url: url,
    });
  },

  showToast(e) {
    const message = e.currentTarget ? e.currentTarget.dataset.toast : e;
    wx.showToast({
      title: typeof message === "string" ? message : "功能开发中",
      icon: "none",
      duration: 2000,
    });
  },
});
