// app.ts
App<IAppOption>({
  globalData: {},
  onLaunch() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      try {
        wx.cloud.init({
          env: 'cloud1-0grrc4znc15e5fde',
          traceUser: true,
        });
        console.log('云开发初始化成功');
      } catch (error) {
        console.error('云开发初始化失败', error);
      }
    }

    // 展示本地存储能力
    try {
      const logs = wx.getStorageSync('logs') || [];
      logs.unshift(Date.now());
      wx.setStorageSync('logs', logs);
    } catch (error) {
      console.error('本地存储失败', error);
    }

    // 登录
    wx.login({
      success: res => {
        console.log(res.code);
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      },
      fail: err => {
        console.error('登录失败', err);
      }
    });
  },
})