## 2. 项目概述

### 2.1 项目背景

为[景辉汽车美容公司]开发一款微信小程序，旨在简化用户预约洗车/美容服务、购买店内商品的流程，并为门店员工提供高效的订单管理和客户服务工具。项目初期聚焦于单门店运营。

### 2.2 项目目标

- **用户端**: 提供便捷的在线服务预约、商品浏览与购买（门店自提）功能，实时查看服务进度。
- **管理端**: 实现服务排班、订单（预约单/现场单）管理、服务状态更新、商品管理、基础数据统计功能。
- **技术目标**: 构建稳定、可扩展的小程序及后台系统，确保数据准确、流程顺畅。

## 3. 功能范围 (Scope)

### 3.1 核心功能模块 (用户端 - 小程序)

1. **用户认证与管理**

- 微信快捷登录/授权
- 车辆信息管理 (添加、编辑、删除 - 品牌、型号、车牌号)

1. **服务预约**

- 浏览服务列表 (洗车、打蜡等，含名称、价格、预估时长)
- 查看可选预约时间段 (基于门店设定和已预约情况)
- 选择服务、车辆、预约时间
- 创建预约订单 (初始状态: `待到店`)
- 在线支付 (微信支付)
- 查看预约订单详情及状态
- (可选) 取消预约 (需定义规则，如提前X小时)

1. **商品购买 (门店服务)**

- 浏览商品列表 (分类、名称、图片、价格、描述)
- 商品详情查看
- 加入购物车
- 购物车管理 (增减数量、删除)
- 创建商品订单 (支付后状态: `待自提`)
- 在线支付 (微信支付)
- 查看商品订单详情及状态

1. **订单中心**

- 统一展示服务订单和商品订单列表
- **服务订单状态**:

- `待到店` (仅预约单)
- `等待服务` (预约单到店确认后 / 现场单创建后)
- `服务中`
- `已完成` / `可取车`

- **商品订单状态**:

- `待支付`
- `待自提` (支付完成)
- `已完成` (用户取货后，后台更新)

- 订单详情查看

1. **我的**

- 个人信息入口
- 车辆管理入口
- (可选) 优惠券、积分等
- 联系客服 (显示电话、地址)

1. **消息通知**

- 预约成功提醒
- 服务状态变更提醒 (如：`服务中` -> `可取车`)
- (可选) 活动/优惠推送

### 3.2 核心功能模块 (管理端 - Web后台)

1. **登录/权限管理** (基础)
2. **服务管理**

- 添加、编辑、删除服务项目 (名称、价格、预估时长、描述)
- 设置服务可预约状态

1. **排班与可预约时段管理**

- 设置每日营业时间
- 设置各时段可接受的最大预约量/工位数
- (可选) 特殊日期（如节假日）排班调整

1. **订单管理**

- **服务订单列表**:

- 区分`预约单`和`现场单`
- 按状态筛选 (`待到店`, `等待服务`, `服务中`, `已完成`)
- 查看订单详情 (用户、车辆、服务项目、金额、时间)
- **核心操作**:

- **确认到店**: 将`待到店`状态的预约单更新为 `等待服务`
- **开始服务**: 将`等待服务`状态的订单更新为 `服务中` (记录开始时间)
- **完成服务**: 将`服务中`状态的订单更新为 `已完成`/`可取车` (记录结束时间，触发用户通知)

- **现场开单**:

- 选择/输入用户信息 (手机号关联，若无则快速创建简易用户)
- 选择车辆 (可关联用户已有车辆或临时输入)
- 选择服务项目
- 创建订单 (初始状态: `等待服务`)
- (可选) 记录线下收款信息或引导用户小程序支付 (若现场单也需线上支付)

- **商品订单列表**:

- 按状态筛选 (`待自提`, `已完成`)
- 查看订单详情 (用户、商品、金额)
- **核心操作**:

- **确认取货**: 将`待自提`状态订单更新为 `已完成`

1. **商品管理**

- 添加、编辑、删除商品 (名称、分类、图片、价格、描述、库存)
- 管理商品分类
- 库存预警 (可选)

1. **用户管理**

- 查看用户列表 (微信昵称、手机号、车辆信息)
- 查看用户订单历史

1. **数据统计 (基础)**

- 每日/每周/每月 预约单量、现场单量
- 每日/每周/每月 服务收入、商品销售额
- 热门服务/商品排行

## 4. 非功能性需求

- **性能**: 小程序加载速度快，后台响应及时。
- **可用性**: 系统稳定运行，核心流程无阻塞。
- **安全性**: 支付安全，用户信息防泄漏。
- **兼容性**: 主流微信版本兼容。

## 5. 数据结构 / 核心模型 (示例)

- **User**: `user_id`, `openid`, `nickname`, `avatar_url`, `phone`, `created_at`
- **Vehicle**: `vehicle_id`, `user_id`, `brand`, `model`, `plate_number`, `is_default`, `created_at`
- **Service**: `service_id`, `name`, `description`, `price`, `estimated_duration_minutes`, `is_active`, `sort_order`
- **Product**: `product_id`, `category_id`, `name`, `description`, `price`, `main_image_url`, `stock_quantity`, `is_active`
- **ProductCategory**: `category_id`, `name`, `sort_order`
- **TimeSlotConfig**: `config_id`, `day_of_week` (1-7 or specific date), `start_time` (HH:MM), `end_time` (HH:MM), `capacity` (max concurrent services)
- **ServiceOrder**: `order_id`, `order_sn`, `user_id`, `vehicle_id`, `service_id`, `order_type` (`BOOKING`, `WALK_IN`), `scheduled_time` (for BOOKING), `arrival_time`, `service_start_time`, `service_end_time`, `status` (`PENDING_ARRIVAL`, `WAITING_SERVICE`, `IN_PROGRESS`, `COMPLETED`), `total_amount`, `payment_status` (`PENDING`, `PAID`), `payment_method`, `created_at`
- **ProductOrder**: `order_id`, `order_sn`, `user_id`, `total_amount`, `status` (`PENDING_PAYMENT`, `PENDING_PICKUP`, `COMPLETED`), `payment_status`, `payment_method`, `created_at`, `pickup_time`
- **ProductOrderItem**: `item_id`, `product_order_id`, `product_id`, `quantity`, `price_per_item` (at time of order)
- **(Admin) Staff**: `staff_id`, `username`, `password_hash`, `role`, `is_active`

*(注：以上为核心字段示例，具体字段需根据详细设计确定，如增加软删除标记* `*is_deleted*` *等)*

## 6. 接口定义 (概要 - 后续需提供详细API文档)

### 用户端 API (示例)

- `POST /auth/wechat_login`
- `GET /user/profile`
- `POST /user/vehicles`, `PUT /user/vehicles/{id}`, `DELETE /user/vehicles/{id}`
- `GET /services`
- `GET /products`
- `GET /products/{id}`
- `GET /availability?date=YYYY-MM-DD` (返回可用时间段及剩余容量)
- `POST /service_orders/booking` (创建预约单)
- `POST /product_orders` (创建商品订单)
- `GET /orders` (获取用户所有订单列表)
- `GET /orders/service/{id}`
- `GET /orders/product/{id}`
- `POST /payment/wechat_pay` (获取支付参数)
- `POST /payment/notify/wechat` (微信支付回调)

### 管理端 API (示例)

- `POST /admin/auth/login`
- `GET /admin/services`, `POST /admin/services`, `PUT /admin/services/{id}`...
- `GET /admin/products`, `POST /admin/products`, `PUT /admin/products/{id}`...
- `GET /admin/timeslots`, `POST /admin/timeslots`...
- `GET /admin/orders/service` (可带参数筛选状态、类型)
- `PUT /admin/orders/service/{id}/confirm_arrival`
- `PUT /admin/orders/service/{id}/start_service`
- `PUT /admin/orders/service/{id}/complete_service`
- `POST /admin/orders/service/walk_in` (创建现场单)
- `GET /admin/orders/product`
- `PUT /admin/orders/product/{id}/confirm_pickup`
- `GET /admin/users`
- `GET /admin/stats/...`

## 7. 里程碑 & 优先级 (建议)

1. **MVP (Minimum Viable Product)**:

- 用户端: 微信登录、车辆管理、服务浏览、时间段查看、**服务预约与支付**、订单中心(状态查看)、商品浏览、**商品购买(自提)与支付**。
- 管理端: 登录、服务管理、商品管理、**排班/时段基础设置**、**服务订单管理(含状态更新)**、**现场开单(基础)**、商品订单管理(确认取货)。

1. **Phase 2**:

- 用户端: 预约取消、优惠券/积分(基础)、消息通知。
- 管理端: 完善的用户管理、基础数据统计。

1. **Phase 3**:

- 更详细的数据统计与报表。
- 营销功能 (如推荐、活动配置)。
- 更精细化的后台权限管理。