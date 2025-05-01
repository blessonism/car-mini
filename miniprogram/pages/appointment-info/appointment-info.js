// appointment-info.js
Page({
  data: {
    appointmentData: {},
    selectedCarId: '1', // 默认选择第一辆车
    showAddCarForm: false,
    remark: '',
    newCar: {
      plate: '粤A12345',
      brand: '宝马',
      model: '3系',
      color: '白色'
    },
    brandOptions: [
      { label: '宝马', value: '宝马' },
      { label: '奥迪', value: '奥迪' },
      { label: '奔驰', value: '奔驰' },
      { label: '大众', value: '大众' },
      { label: '丰田', value: '丰田' },
      { label: '本田', value: '本田' },
      { label: '日产', value: '日产' },
      { label: '别克', value: '别克' },
      { label: '福特', value: '福特' },
      { label: '其他品牌', value: '其他品牌' }
    ],
    colorOptions: [
      { label: '白色', value: '白色' },
      { label: '黑色', value: '黑色' },
      { label: '灰色', value: '灰色' },
      { label: '红色', value: '红色' },
      { label: '蓝色', value: '蓝色' },
      { label: '银色', value: '银色' },
      { label: '其他颜色', value: '其他颜色' }
    ],
    cars: [
      {
        id: '1',
        plate: '粤A12345',
        brand: '宝马',
        model: '3系',
        color: '白色'
      },
      {
        id: '2',
        plate: '粤B67890',
        brand: '奥迪',
        model: 'A4L',
        color: '黑色'
      }
    ],
    // 添加picker显示状态
    brandPickerVisible: false,
    colorPickerVisible: false
  },

  onLoad(options) {
    if (options.appointmentData) {
      const appointmentData = JSON.parse(options.appointmentData);
      this.setData({
        appointmentData
      });
    }
  },

  // 选择车辆
  selectCar(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({
      selectedCarId: id
    });
  },

  // Radio Group 变更事件
  onCarChange(e) {
    this.setData({
      selectedCarId: e.detail.value
    });
  },

  // 切换显示/隐藏添加车辆表单
  toggleAddCarForm() {
    this.setData({
      showAddCarForm: !this.data.showAddCarForm
    });
  },

  // 输入框变更事件
  onInputChange(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`newCar.${field}`]: e.detail.value
    });
  },

  // 显示品牌选择器
  showBrandPicker() {
    this.setData({
      brandPickerVisible: true
    });
  },

  // 隐藏品牌选择器
  hideBrandPicker() {
    this.setData({
      brandPickerVisible: false
    });
  },

  // 确认品牌选择
  onBrandConfirm(e) {
    const { value } = e.detail;
    this.setData({
      'newCar.brand': value[0],
      brandPickerVisible: false
    });
  },

  // 显示颜色选择器
  showColorPicker() {
    this.setData({
      colorPickerVisible: true
    });
  },

  // 隐藏颜色选择器
  hideColorPicker() {
    this.setData({
      colorPickerVisible: false
    });
  },

  // 确认颜色选择
  onColorConfirm(e) {
    const { value } = e.detail;
    this.setData({
      'newCar.color': value[0],
      colorPickerVisible: false
    });
  },

  // 备注变更事件
  onRemarkChange(e) {
    this.setData({
      remark: e.detail.value
    });
  },

  // 返回上一步
  prevStep() {
    wx.navigateBack();
  },

  // 进入下一步
  nextStep() {
    // 如果显示了添加新车辆表单，验证信息是否完整
    if (this.data.showAddCarForm) {
      const { plate, brand, model, color } = this.data.newCar;
      if (!plate || !brand || !model || !color) {
        wx.showToast({
          title: '请完善车辆信息',
          icon: 'none'
        });
        return;
      }
    }

    // 获取选中的车辆信息
    let selectedCar;
    if (this.data.showAddCarForm) {
      // 如果是新增车辆，使用新车辆信息
      selectedCar = this.data.newCar;
    } else {
      // 否则使用已有车辆中的选中车辆
      selectedCar = this.data.cars.find(car => car.id === this.data.selectedCarId);
    }

    // 合并预约信息
    const appointmentData = {
      ...this.data.appointmentData,
      car: selectedCar,
      remark: this.data.remark
    };

    // 跳转到支付确认页面
    wx.navigateTo({
      url: `/pages/appointment-payment/appointment-payment?appointmentData=${JSON.stringify(appointmentData)}`
    });
  },

  onBack() {
    wx.navigateBack();
  }
}); 