Component({
  data: {
    selected: 0,
    color: "#9ca3af",
    selectedColor: "#3b82f6",
    list: [
      {
        pagePath: "pages/home/home",
        text: "首页",
        iconPath: "../assets/icons/home.png",
        selectedIconPath: "../assets/icons/home-active.png"
      },
      {
        pagePath: "pages/service/service",
        text: "服务",
        iconPath: "../assets/icons/service.png",
        selectedIconPath: "../assets/icons/service-active.png"
      },
      {
        pagePath: "pages/order/order",
        text: "订单",
        iconPath: "../assets/icons/order.png",
        selectedIconPath: "../assets/icons/order-active.png"
      },
      {
        pagePath: "pages/profile/profile",
        text: "我的",
        iconPath: "../assets/icons/profile.png",
        selectedIconPath: "../assets/icons/profile-active.png"
      }
    ]
  },
  lifetimes: {
    attached() {
      // 组件挂载时先更新选中态
      this.setData({
        selected: this.getTabBarIndex()
      });
    },
    ready() {
      // 组件完成渲染时更新状态
      this.updateActive();
    },
    // 添加错误处理
    error(err) {
      console.error('Custom tab bar error:', err);
    }
  },
  pageLifetimes: {
    // 页面生命周期函数-监听页面显示
    show() {
      this.updateActive();
    },
    // 页面隐藏时也更新一次，保持数据一致
    hide() {
      this.updateActive();
    }
  },
  methods: {
    updateActive() {
      try {
        // 更新选中态
        const index = this.getTabBarIndex();
        if (index !== this.data.selected) {
          this.setData({ selected: index });
        }
      } catch(e) {
        console.error('Update active error:', e);
      }
    },
    switchTab(e) {
      try {
        const data = e.currentTarget.dataset;
        const url = data.path;
        wx.switchTab({
          url: "/" + url
        });
        this.setData({
          selected: data.index
        });
      } catch(e) {
        console.error('Switch tab error:', e);
      }
    },
    getTabBarIndex() {
      try {
        const pages = getCurrentPages();
        const currentPage = pages[pages.length - 1];
        const route = currentPage?.route || '';
        
        // 查找当前页面在tabBar中的索引
        const list = this.data.list;
        for (let i = 0; i < list.length; i++) {
          if (route === list[i].pagePath) {
            return i;
          }
        }
        return 0;
      } catch(e) {
        console.error('Get tab bar index error:', e);
        return 0;
      }
    }
  }
}) 