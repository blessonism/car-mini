// order-detail.js
Page({
  data: {
    orderInfo: {
      id: 'OD202307150001',
      orderNo: 'OD202307150001',
      status: 'pending', // pending, processing, completed, cancelled
      statusText: '待服务',
      statusDesc: '预约成功，等待门店服务',
      createTime: '2023-07-15 15:30',
      appointmentTime: '2023-07-20 14:30',
      storeName: '车店智能养护中心(总店)',
      storeAddress: '广州市天河区天河路385号',
      contactPhone: '020-12345678',
      amount: 399,
      discount: 50,
      totalAmount: 349,
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
    
    // 根据状态设置不同的状态文本和描述
    this.updateStatusText();
  },
  
  // 更新订单状态文本和描述
  updateStatusText: function() {
    let statusText = '';
    let statusDesc = '';
    
    switch(this.data.orderInfo.status) {
      case 'pending':
        statusText = '待服务';
        statusDesc = '预约成功，等待门店服务';
        break;
      case 'processing':
        statusText = '服务中';
        statusDesc = '正在门店接受服务';
        break;
      case 'completed':
        statusText = '已完成';
        statusDesc = '服务已完成，感谢您的信任';
        break;
      case 'cancelled':
        statusText = '已取消';
        statusDesc = '订单已取消';
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
      }
      
      this.setData({
        'orderInfo.status': status,
        'orderInfo.id': orderId
      });
      
      this.updateStatusText();
      
    }, 500);
  },
  
  // 取消预约
  cancelOrder: function() {
    wx.showModal({
      title: '取消预约',
      content: '确定要取消该预约吗？',
      success: (res) => {
        if (res.confirm) {
          // 实际项目中应该调用服务器API进行取消操作
          wx.showLoading({
            title: '处理中...',
          });
          
          setTimeout(() => {
            wx.hideLoading();
            
            this.setData({
              'orderInfo.status': 'cancelled'
            });
            
            this.updateStatusText();
            
            wx.showToast({
              title: '已取消预约',
              icon: 'success'
            });
            
          }, 1000);
        }
      }
    });
  },
  
  // 联系门店
  contactStore: function() {
    wx.makePhoneCall({
      phoneNumber: this.data.orderInfo.contactPhone,
      fail: () => {
        wx.showToast({
          title: '拨打电话失败',
          icon: 'none'
        });
      }
    });
  },
  
  // 评价服务
  writeReview: function() {
    wx.navigateTo({
      url: '/pages/review/review?orderId=' + this.data.orderInfo.id
    });
  },
  
  // 再次预约
  orderAgain: function() {
    wx.navigateTo({
      url: '/pages/appointment-service/appointment-service'
    });
  },
  
  // 返回上一页
  onBack: function() {
    wx.navigateBack();
  }
}) 