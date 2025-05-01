// store-order-detail.js
Page({
  data: {
    orderInfo: {
      id: 'OD202307150001',
      orderNo: 'OD202307150001',
      status: 'pending', // pending, processing, completed, cancelled, rejected
      statusText: '待接单',
      statusDesc: '新订单等待门店接单',
      createTime: '2023-07-15 15:30',
      appointmentTime: '2023-07-20 14:30',
      startTime: '',
      endTime: '',
      storeName: '车店智能养护中心(总店)',
      storeAddress: '广州市天河区天河路385号',
      storePhone: '020-12345678',
      customerName: '张先生',
      customerPhone: '13800138000',
      memberLevel: 2,
      memberLevelText: '黄金会员',
      amount: 399,
      discount: 50,
      totalAmount: 349,
      paymentMethod: '微信支付',
      carInfo: {
        plate: '粤A12345',
        brand: '宝马',
        model: '3系',
        color: '白色'
      },
      services: [
        {
          id: 1,
          name: '全车养护',
          description: '全车深度清洁与养护',
          price: 399
        }
      ],
      remark: '请提前15分钟做好车辆检查准备'
    }
  },

  onLoad: function(options) {
    // 如果传入了订单ID，则获取订单详情
    if (options.id) {
      this.loadOrderDetail(options.id);
    }
    
    // 更新状态文本
    this.updateStatusText();
  },
  
  // 更新订单状态文本和描述
  updateStatusText: function() {
    let statusText = '';
    let statusDesc = '';
    
    switch(this.data.orderInfo.status) {
      case 'pending':
        statusText = '待接单';
        statusDesc = '新订单等待门店接单';
        break;
      case 'processing':
        statusText = '服务中';
        statusDesc = '服务正在进行中';
        break;
      case 'completed':
        statusText = '已完成';
        statusDesc = '服务已完成';
        break;
      case 'cancelled':
        statusText = '已取消';
        statusDesc = '客户已取消订单';
        break;
      case 'rejected':
        statusText = '已拒绝';
        statusDesc = '门店已拒绝接单';
        break;
      default:
        statusText = '未知状态';
        statusDesc = '订单状态未知';
    }
    
    this.setData({
      'orderInfo.statusText': statusText,
      'orderInfo.statusDesc': statusDesc
    });
  },
  
  // 加载订单详情
  loadOrderDetail: function(orderId) {
    // 实际项目中应该从服务器获取订单详情
    // 这里使用模拟数据
    
    // 模拟API请求延迟
    wx.showLoading({
      title: '加载中...',
    });
    
    setTimeout(() => {
      wx.hideLoading();
      
      // 不同的订单状态测试
      let status = 'pending';
      // 根据订单ID尾号模拟不同状态
      const lastChar = orderId.charAt(orderId.length - 1);
      if (lastChar === '1') {
        status = 'processing';
      } else if (lastChar === '2') {
        status = 'completed';
      } else if (lastChar === '3') {
        status = 'cancelled';
      } else if (lastChar === '4') {
        status = 'rejected';
      }
      
      this.setData({
        'orderInfo.status': status,
        'orderInfo.id': orderId
      });
      
      this.updateStatusText();
      
    }, 500);
  },
  
  // 接受订单
  acceptOrder: function() {
    wx.showModal({
      title: '接受订单',
      content: '确定要接受该订单吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '处理中...',
          });
          
          setTimeout(() => {
            wx.hideLoading();
            
            const now = new Date();
            const timeString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            
            this.setData({
              'orderInfo.status': 'processing',
              'orderInfo.startTime': timeString
            });
            
            this.updateStatusText();
            
            wx.showToast({
              title: '已接受订单',
              icon: 'success'
            });
          }, 1000);
        }
      }
    });
  },
  
  // 拒绝订单
  rejectOrder: function() {
    wx.showModal({
      title: '拒绝订单',
      content: '确定要拒绝该订单吗？拒绝后将无法恢复。',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '处理中...',
          });
          
          setTimeout(() => {
            wx.hideLoading();
            
            this.setData({
              'orderInfo.status': 'rejected'
            });
            
            this.updateStatusText();
            
            wx.showToast({
              title: '已拒绝订单',
              icon: 'success'
            });
          }, 1000);
        }
      }
    });
  },
  
  // 完成服务
  completeOrder: function() {
    wx.showModal({
      title: '完成服务',
      content: '确定服务已完成吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '处理中...',
          });
          
          setTimeout(() => {
            wx.hideLoading();
            
            const now = new Date();
            const timeString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            
            this.setData({
              'orderInfo.status': 'completed',
              'orderInfo.endTime': timeString
            });
            
            this.updateStatusText();
            
            wx.showToast({
              title: '服务已完成',
              icon: 'success'
            });
          }, 1000);
        }
      }
    });
  },
  
  // 联系客户
  contactCustomer: function() {
    this.makeCall(this.data.orderInfo.customerPhone);
  },
  
  // 拨打门店电话
  callStore: function() {
    this.makeCall(this.data.orderInfo.storePhone);
  },
  
  // 拨打客户电话
  callCustomer: function() {
    this.makeCall(this.data.orderInfo.customerPhone);
  },
  
  // 拨打电话
  makeCall: function(phoneNumber) {
    wx.makePhoneCall({
      phoneNumber: phoneNumber,
      fail: () => {
        wx.showToast({
          title: '拨打电话失败',
          icon: 'none'
        });
      }
    });
  },
  
  // 返回上一页
  onBack: function() {
    wx.navigateBack();
  }
}) 