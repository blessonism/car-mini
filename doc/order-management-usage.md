# 汽车服务小程序订单管理系统使用说明

## 系统概述

订单管理系统是汽车服务小程序的核心功能，包含服务项目管理、预约管理、订单管理和支付管理四个主要模块。系统采用云开发架构，使用云函数和云数据库实现业务逻辑。

## 数据表结构

系统使用四个主要数据表：

- **服务项目表(services)**：存储可提供的服务项目
- **预约表(appointments)**：存储用户的服务预约
- **订单表(orders)**：存储消费订单
- **支付表(payments)**：存储支付记录

详细的数据结构请参考 [订单管理数据库结构设计](./order-management-schema.md)。

## 云函数分组

云函数按数据表进行了分组，便于管理和部署：

### 服务项目相关云函数

- `getServices`: 获取服务项目列表
- `addService`: 添加新服务项目(管理员)
- `updateService`: 更新服务项目(管理员)
- `deleteService`: 标记服务项目为非活跃(管理员)

### 预约相关云函数

- `getUserAppointments`: 获取用户预约列表
- `createAppointment`: 创建新预约
- `updateAppointmentStatus`: 更新预约状态

### 订单相关云函数

- `createOrderFromAppointment`: 从预约创建订单(管理员)
- `getUserOrders`: 获取用户订单列表
- `updateOrderStatus`: 更新订单状态

### 支付相关云函数

- `createPayment`: 创建支付记录

## 基本业务流程

1. **服务预约流程**:

   - 用户选择服务项目 → 选择车辆 → 选择时间 → 提交预约
   - 系统调用`createAppointment`创建预约
   - 管理员确认预约，调用`updateAppointmentStatus`将状态更新为"已确认"

2. **订单创建与支付**:

   - 服务完成后，管理员调用`createOrderFromAppointment`从预约创建订单
   - 系统生成订单号，计算金额
   - 用户支付，调用`createPayment`创建支付记录
   - 系统自动更新订单支付状态

3. **订单查询**:
   - 用户查询订单列表，调用`getUserOrders`
   - 用户或管理员查看订单详情

## 部署与维护 (优化版)

系统采用共享依赖模式，大幅减少了每个云函数的体积和部署时间。所有云函数共享一份`wx-server-sdk`等核心依赖，避免重复安装。

1. **安装共享依赖**:

   ```bash
   # 安装共享依赖，自动创建shared-deps目录
   node install-cloud-functions.js

   # 也可以按分组安装
   node install-cloud-functions.js services
   ```

2. **部署云函数**:

   ```bash
   # 部署所有云函数，会自动检查共享依赖
   node deploy-cloud-functions.js

   # 部署特定分组的云函数
   node deploy-cloud-functions.js orders
   ```

3. **添加特定依赖**:

   如果某个云函数需要额外的依赖，可在该云函数的package.json中手动添加，然后单独执行npm install:

   ```bash
   cd cloudfunctions/yourFunctionName
   npm install your-special-package --save
   ```

## 共享依赖架构优势

1. **更小的部署包**: 单个云函数包大小显著减少，因为核心依赖只存储一次
2. **更快的部署速度**: 避免了每次部署时重复安装相同依赖
3. **更易维护**: 依赖升级只需在一处更新
4. **更低的出错率**: 统一的依赖版本，避免版本不一致问题

## 安全控制

根据数据库安全规则设计：

- 服务项目表：所有用户可读，仅管理员可写
- 预约表：仅创建者和管理员可读写
- 订单表：仅创建者可读，管理员可读写
- 支付表：仅创建者可读，管理员可读写

这些安全规则在云函数中通过代码逻辑进行了实现。

## 前端调用示例

```javascript
// 获取服务列表示例
wx.cloud
  .callFunction({
    name: "getServices",
    data: {
      category: "保养", // 可选，按类别筛选
    },
  })
  .then((res) => {
    if (res.result.success) {
      const services = res.result.data;
      // 处理服务列表数据
    }
  });

// 创建预约示例
wx.cloud
  .callFunction({
    name: "createAppointment",
    data: {
      userId: "user123",
      vehicleId: "vehicle456",
      appointmentTime: new Date("2023-12-25 14:30:00"),
      serviceIds: ["service1", "service2"],
      duration: 60,
      storeId: "store1",
      contactPhone: "13800138000",
    },
  })
  .then((res) => {
    if (res.result.success) {
      // 预约创建成功
    }
  });
```

## 常见问题

1. **订单状态无法更新**：检查当前用户权限，普通用户只能取消未支付的订单

2. **支付失败**：检查支付金额是否超过了订单剩余应付金额

3. **云函数调用失败**：检查云开发环境ID是否正确配置

4. **部署云函数失败**：检查共享依赖是否正确安装，可以重新运行`node install-cloud-functions.js`

如需更多帮助，请参考开发文档或联系技术支持。
