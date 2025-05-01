// appointment-time.js
Page({
  data: {
    selectedService: '',
    selectedDate: '',
    selectedTime: '',
    selectedStore: '',
    dateList: [],
    timeSlots: [
      { value: '09:00', label: '09:00', available: true },
      { value: '10:00', label: '10:00', available: true },
      { value: '11:00', label: '11:00', available: true },
      { value: '12:00', label: '12:00', available: false },
      { value: '13:00', label: '13:00', available: true },
      { value: '14:00', label: '14:00', available: true },
      { value: '15:00', label: '15:00', available: true },
      { value: '16:00', label: '16:00', available: true },
      { value: '17:00', label: '17:00', available: true },
      { value: '18:00', label: '18:00', available: false },
      { value: '19:00', label: '19:00', available: true },
      { value: '20:00', label: '20:00', available: true }
    ],
    stores: [
      {
        id: '1',
        name: '广州天河店',
        address: '广州市天河区天河路385号',
        distance: '3.2km'
      },
      {
        id: '2',
        name: '广州车陂店',
        address: '广州市天河区车陂路288号',
        distance: '5.8km'
      }
    ]
  },

  onLoad(options) {
    if (options.service) {
      this.setData({
        selectedService: options.service
      });
    }
    this.generateDateList();
    // 默认选中第一个可用日期
    if (this.data.dateList.length > 0) {
      this.setData({
        selectedDate: this.data.dateList[0].value
      });
    }
    // 默认选择第一个可用时间
    const availableTime = this.data.timeSlots.find(time => time.available);
    if (availableTime) {
      this.setData({
        selectedTime: availableTime.value
      });
    }
    // 默认选择第一个门店
    this.setData({
      selectedStore: this.data.stores[0].id
    });
  },

  // 生成未来7天的日期列表
  generateDateList() {
    const dateList = [];
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      
      const day = weekDays[date.getDay()];
      const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
      let text = '';
      
      if (i === 0) {
        text = '今天';
      } else if (i === 1) {
        text = '明天';
      } else {
        text = day;
      }
      
      dateList.push({
        value: `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`,
        day,
        date: dateStr,
        text
      });
    }
    
    this.setData({ dateList });
  },

  // 选择日期
  selectDate(e) {
    const date = e.currentTarget.dataset.date;
    this.setData({
      selectedDate: date
    });
  },

  // 选择时间
  selectTime(e) {
    const time = e.currentTarget.dataset.time;
    this.setData({
      selectedTime: time
    });
  },

  // 选择门店
  selectStore(e) {
    const storeId = e.currentTarget.dataset.store;
    this.setData({
      selectedStore: storeId
    });
  },

  // 返回上一步
  prevStep() {
    wx.navigateBack();
  },

  // 进入下一步
  nextStep() {
    if (!this.data.selectedDate || !this.data.selectedTime || !this.data.selectedStore) {
      wx.showToast({
        title: '请选择日期、时间和门店',
        icon: 'none'
      });
      return;
    }

    // 找到选中的门店信息
    const store = this.data.stores.find(s => s.id === this.data.selectedStore);

    // 构建预约信息
    const appointmentData = {
      service: this.data.selectedService,
      date: this.data.selectedDate,
      time: this.data.selectedTime,
      store: store ? store.name : '',
      storeAddress: store ? store.address : ''
    };

    // 将数据传递到下一页
    wx.navigateTo({
      url: `/pages/appointment-info/appointment-info?appointmentData=${JSON.stringify(appointmentData)}`
    });
  },

  onBack() {
    wx.navigateBack();
  }
}); 