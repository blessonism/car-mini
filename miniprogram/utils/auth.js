// 用户登录和认证相关工具函数

// 存储相关的key常量
const STORAGE_KEYS = {
  USER_INFO: "userInfo",
  LOGIN_STATE: "loginState",
  PARTIAL_USER_INFO: "partialUserInfo",
  LAST_USER_REFRESH: "lastUserRefresh",
  LAST_VEHICLE_REFRESH: "lastVehicleRefresh",
  VEHICLES_INFO: "vehiclesInfo",
};

// 数据刷新的最小间隔时间（毫秒）- 默认24小时
const REFRESH_INTERVAL = 24 * 60 * 60 * 1000;

/**
 * 检查用户是否已登录
 * @returns {Boolean} 是否已登录
 */
const checkLoginState = () => {
  try {
    // 检查登录状态存储
    const loginState = wx.getStorageSync(STORAGE_KEYS.LOGIN_STATE);
    // 检查用户信息是否存在
    const userInfo = wx.getStorageSync(STORAGE_KEYS.USER_INFO);

    if (!loginState || !userInfo) {
      return false;
    }

    return loginState === "loggedIn" && userInfo;
  } catch (error) {
    console.error("检查登录状态出错", error);
    return false;
  }
};

/**
 * 获取本地存储的用户信息
 * @returns {Object|null} 用户信息对象或null
 */
const getStoredUserInfo = () => {
  try {
    return wx.getStorageSync(STORAGE_KEYS.USER_INFO) || null;
  } catch (error) {
    console.error("获取用户信息出错", error);
    return null;
  }
};

/**
 * 保存用户信息到本地存储并标记为已登录
 * @param {Object} userInfo 用户信息对象
 */
const saveUserInfo = (userInfo) => {
  try {
    // 确保用户信息是完整的
    if (userInfo && userInfo.phone) {
      wx.setStorageSync(STORAGE_KEYS.USER_INFO, userInfo);
      wx.setStorageSync(STORAGE_KEYS.LOGIN_STATE, "loggedIn");
      // 清除可能存在的部分信息
      wx.removeStorageSync(STORAGE_KEYS.PARTIAL_USER_INFO);
      // 更新刷新时间戳
      updateUserRefreshTime();
    } else {
      console.warn("尝试保存不完整的用户信息，仅保存但不设置登录状态");
      savePartialUserInfo(userInfo);
    }
  } catch (error) {
    console.error("保存用户信息出错", error);
  }
};

/**
 * 保存部分用户信息，但不标记为已登录
 * @param {Object} userInfo 不完整的用户信息对象
 */
const savePartialUserInfo = (userInfo) => {
  try {
    wx.setStorageSync(STORAGE_KEYS.PARTIAL_USER_INFO, userInfo);
  } catch (error) {
    console.error("保存部分用户信息出错", error);
  }
};

/**
 * 获取部分存储的用户信息
 * @returns {Object|null} 部分用户信息对象或null
 */
const getPartialUserInfo = () => {
  try {
    return wx.getStorageSync(STORAGE_KEYS.PARTIAL_USER_INFO) || null;
  } catch (error) {
    console.error("获取部分用户信息出错", error);
    return null;
  }
};

/**
 * 获取本地缓存的车辆信息
 * @returns {Array|null} 车辆信息数组或null
 */
const getStoredVehicles = () => {
  try {
    return wx.getStorageSync(STORAGE_KEYS.VEHICLES_INFO) || null;
  } catch (error) {
    console.error("获取车辆信息出错", error);
    return null;
  }
};

/**
 * 保存车辆信息到本地缓存
 * @param {Array} vehicles 车辆信息数组
 */
const saveVehiclesInfo = (vehicles) => {
  try {
    wx.setStorageSync(STORAGE_KEYS.VEHICLES_INFO, vehicles);
    updateVehicleRefreshTime();
  } catch (error) {
    console.error("保存车辆信息出错", error);
  }
};

/**
 * 更新用户信息刷新时间戳
 */
const updateUserRefreshTime = () => {
  try {
    wx.setStorageSync(STORAGE_KEYS.LAST_USER_REFRESH, Date.now());
  } catch (error) {
    console.error("更新用户刷新时间戳出错", error);
  }
};

/**
 * 更新车辆信息刷新时间戳
 */
const updateVehicleRefreshTime = () => {
  try {
    wx.setStorageSync(STORAGE_KEYS.LAST_VEHICLE_REFRESH, Date.now());
  } catch (error) {
    console.error("更新车辆刷新时间戳出错", error);
  }
};

/**
 * 检查是否需要刷新用户信息
 * @returns {Boolean} 是否需要刷新
 */
const shouldRefreshUserInfo = () => {
  try {
    const lastRefresh = wx.getStorageSync(STORAGE_KEYS.LAST_USER_REFRESH) || 0;
    return Date.now() - lastRefresh > REFRESH_INTERVAL;
  } catch (error) {
    console.error("检查用户刷新状态出错", error);
    return true; // 出错时默认需要刷新
  }
};

/**
 * 检查是否需要刷新车辆信息
 * @returns {Boolean} 是否需要刷新
 */
const shouldRefreshVehicles = () => {
  try {
    const lastRefresh =
      wx.getStorageSync(STORAGE_KEYS.LAST_VEHICLE_REFRESH) || 0;
    return Date.now() - lastRefresh > REFRESH_INTERVAL;
  } catch (error) {
    console.error("检查车辆刷新状态出错", error);
    return true; // 出错时默认需要刷新
  }
};

/**
 * 获取微信用户信息（头像、昵称）
 * @returns {Promise} Promise对象
 */
const getUserProfile = () => {
  return new Promise((resolve, reject) => {
    wx.getUserProfile({
      desc: "用于完善会员资料",
      success: (res) => {
        resolve(res.userInfo);
      },
      fail: (err) => {
        console.error("获取用户信息失败", err);
        reject(err);
      },
    });
  });
};

/**
 * 执行微信登录
 * @returns {Promise} Promise对象
 */
const wxLogin = () => {
  return new Promise((resolve, reject) => {
    wx.login({
      success: (res) => {
        if (res.code) {
          resolve(res.code);
        } else {
          reject(new Error("微信登录失败"));
        }
      },
      fail: reject,
    });
  });
};

/**
 * 使用云函数登录
 * @param {Object} userInfo 用户信息对象
 * @returns {Promise} Promise对象
 */
const cloudLogin = async (userInfo = {}) => {
  try {
    console.log("准备调用login云函数，参数:", { userInfo });

    // 调用云函数登录
    const loginResult = await wx.cloud.callFunction({
      name: "login",
      data: { userInfo },
    });

    console.log("云函数login返回结果:", loginResult);

    if (loginResult.result && loginResult.result.code === 0) {
      // 保存用户信息 - 修复数据结构不匹配问题
      console.log("登录成功，保存用户信息:", loginResult.result.data);
      saveUserInfo(loginResult.result.data);
      return loginResult.result.data;
    } else {
      const errorMsg = loginResult.result
        ? loginResult.result.msg || "登录失败"
        : "云函数返回异常";
      console.error("登录失败，原因:", errorMsg, loginResult);
      throw new Error(errorMsg);
    }
  } catch (error) {
    console.error("云函数登录失败", error);
    // 记录更多错误信息
    if (error.errMsg) {
      console.error("错误信息:", error.errMsg);
    }
    if (error.stack) {
      console.error("错误堆栈:", error.stack);
    }
    throw error;
  }
};

/**
 * 获取用户手机号
 * @param {Object} e 事件对象，包含加密数据
 * @returns {Promise} Promise对象
 */
const getPhoneNumber = async (e) => {
  try {
    if (!e.detail.code) {
      throw new Error("用户未授权手机号");
    }

    // 调用云函数获取手机号
    const result = await wx.cloud.callFunction({
      name: "getPhoneNumber",
      data: {
        code: e.detail.code,
      },
    });

    if (result.result && result.result.code === 0) {
      // 更新本地存储的用户信息
      const userInfo = getStoredUserInfo();
      if (userInfo) {
        userInfo.phone = result.result.data.phoneNumber;
        saveUserInfo(userInfo);
      }

      return result.result.data.phoneNumber;
    } else {
      throw new Error(result.result.msg || "获取手机号失败");
    }
  } catch (error) {
    console.error("获取手机号失败", error);
    throw error;
  }
};

/**
 * 退出登录
 */
const logout = () => {
  clearUserInfo();
};

/**
 * 刷新用户信息
 * @param {Boolean} forceRefresh 是否强制刷新
 * @returns {Promise} Promise对象
 */
const refreshUserInfo = async (forceRefresh = false) => {
  try {
    // 如果不强制刷新，且不需要刷新，则返回缓存数据
    if (!forceRefresh && !shouldRefreshUserInfo()) {
      const cachedUserInfo = getStoredUserInfo();
      if (cachedUserInfo) {
        return cachedUserInfo;
      }
    }

    const result = await wx.cloud.callFunction({
      name: "getUserInfo",
    });

    if (result.result && result.result.code === 0) {
      // 更新本地存储
      saveUserInfo(result.result.data);
      return result.result.data;
    } else {
      throw new Error(result.result.msg || "获取用户信息失败");
    }
  } catch (error) {
    console.error("刷新用户信息失败", error);
    throw error;
  }
};

/**
 * 清除用户登录信息
 */
const clearUserInfo = () => {
  try {
    wx.removeStorageSync(STORAGE_KEYS.USER_INFO);
    wx.removeStorageSync(STORAGE_KEYS.LOGIN_STATE);
    wx.removeStorageSync(STORAGE_KEYS.PARTIAL_USER_INFO);
    wx.removeStorageSync(STORAGE_KEYS.VEHICLES_INFO);
    wx.removeStorageSync(STORAGE_KEYS.LAST_USER_REFRESH);
    wx.removeStorageSync(STORAGE_KEYS.LAST_VEHICLE_REFRESH);
  } catch (error) {
    console.error("清除用户信息出错", error);
  }
};

module.exports = {
  checkLoginState,
  getStoredUserInfo,
  saveUserInfo,
  savePartialUserInfo,
  getPartialUserInfo,
  clearUserInfo,
  getUserProfile,
  wxLogin,
  cloudLogin,
  getPhoneNumber,
  logout,
  refreshUserInfo,
  getStoredVehicles,
  saveVehiclesInfo,
  updateUserRefreshTime,
  updateVehicleRefreshTime,
  shouldRefreshUserInfo,
  shouldRefreshVehicles,
  REFRESH_INTERVAL,
};
