# 汽车服务小程序订单管理数据库结构设计

## 概述

本文档描述了汽车服务小程序订单管理系统的数据库表结构设计，包括预约表（appointments）、订单表（orders）、支付表（payments）和服务项目表（services）的字段定义及用途。

## 预约表（appointments）

预约表存储用户的服务预约信息，与用户表和车辆表关联。

| 字段名          | 类型   | 必填 | 描述                                                     |
| --------------- | ------ | ---- | -------------------------------------------------------- |
| \_id            | String | 是   | 文档唯一ID，系统自动生成                                 |
| \_openid        | String | 是   | 用户的微信OpenID                                         |
| userId          | String | 是   | 关联的用户表ID                                           |
| vehicleId       | String | 是   | 关联的车辆表ID                                           |
| createTime      | Date   | 是   | 预约创建时间                                             |
| updateTime      | Date   | 是   | 预约更新时间                                             |
| serviceType     | String | 是   | 服务类型：immediate（立即服务）、appointment（预约服务） |
| appointmentTime | Date   | 是   | 预约服务时间                                             |
| duration        | Number | 是   | 预计服务时长（分钟）                                     |
| serviceId       | String | 是   | 预约服务项目ID                                           |
| status          | String | 是   | 预约状态：待确认、已确认、进行中、已完成、已取消         |
| notes           | String | 否   | 预约备注信息                                             |
| contactPhone    | String | 是   | 联系电话                                                 |
| orderId         | String | 否   | 关联的订单ID（如已生成订单）                             |

### 说明：

1. 一个预约可以包含多个服务项目，通过 **serviceIds** 数组存储
2. 预约状态变更会自动更新 **updateTime** 字段
3. 预约完成后会关联生成订单，通过 **orderId** 字段关联
4. **serviceType** 字段区分立即服务和预约服务，影响预约处理流程和界面展示

## 服务项目表（services）

服务项目表存储所有可提供的汽车服务项目。

| 字段名      | 类型    | 必填 | 描述                                 |
| ----------- | ------- | ---- | ------------------------------------ |
| \_id        | String  | 是   | 文档唯一ID，系统自动生成             |
| createTime  | Date    | 是   | 创建时间                             |
| updateTime  | Date    | 是   | 更新时间                             |
| name        | String  | 是   | 服务名称                             |
| description | String  | 是   | 服务详细描述                         |
| category    | String  | 是   | 服务类别，如：保养、维修、美容等     |
| price       | String  | 是   | 服务价格，以字符串存储，避免精度问题 |
| duration    | Number  | 是   | 服务预计时长（分钟）                 |
| coverImage  | String  | 否   | 服务项目展示图片URL                  |
| isActive    | Boolean | 是   | 服务项目是否有效，默认true           |
| sortOrder   | Number  | 是   | 排序序号，用于前端展示排序           |

### 说明：

1. **price** 字段以字符串形式存储金额，避免浮点数精度问题
2. **category** 字段用于前端分类展示
3. **isActive** 控制服务项目是否在前端可见和可选择

## 订单表（orders）

订单表存储用户的消费订单信息，可能来源于预约或直接消费。

| 字段名         | 类型   | 必填 | 描述                                             |
| -------------- | ------ | ---- | ------------------------------------------------ |
| \_id           | String | 是   | 文档唯一ID，系统自动生成                         |
| \_openid       | String | 是   | 用户的微信OpenID                                 |
| userId         | String | 是   | 关联的用户表ID                                   |
| createTime     | Date   | 是   | 订单创建时间                                     |
| updateTime     | Date   | 是   | 订单更新时间                                     |
| orderNo        | String | 是   | 订单编号，业务可读唯一编号，如"CS20230615001"    |
| appointmentId  | String | 否   | 关联的预约ID（如果订单来源于预约）               |
| vehicleId      | String | 是   | 关联的车辆ID                                     |
| orderItems     | Array  | 是   | 订单项目数组，结构见下方说明                     |
| totalAmount    | String | 是   | 订单总金额，以字符串存储                         |
| discountAmount | String | 是   | 优惠金额，以字符串存储                           |
| actualAmount   | String | 是   | 实付金额，以字符串存储                           |
| status         | String | 是   | 订单状态：待支付、已支付、服务中、已完成、已取消 |
| paymentStatus  | String | 是   | 支付状态：未支付、部分支付、已支付、已退款       |
| storeId        | String | 是   | 服务门店ID                                       |
| staffId        | String | 否   | 服务人员ID                                       |
| notes          | String | 否   | 订单备注信息                                     |
| contactPhone   | String | 是   | 联系电话                                         |
| completionTime | Date   | 否   | 订单完成时间                                     |

### orderItems 数组结构：

每个订单项目是一个对象，包含以下字段：

```json
{
  "itemId": "String",       // 引用的服务ID或产品ID
  "itemType": "String",     // 项目类型："service"或"product"
  "name": "String",         // 项目名称（下单时的名称）
  "unitPrice": "String",    // 下单时的单价，以字符串存储
  "quantity": Number,       // 数量，服务通常为1，产品可能为多个
  "amount": "String",       // 项目总价(unitPrice * quantity)，以字符串存储
  "specs": Object           // 可选，项目规格（如产品型号、服务选项等）
}
```

### 说明：

1. **orderNo** 字段为业务可读的订单编号，可按一定规则生成
2. **orderItems** 数组统一存储订单中的服务和产品信息，通过itemType区分
3. 通过保存下单时的名称和价格，解决了价格历史记录问题
4. 金额相关字段均以字符串存储，避免精度问题
5. **status** 和 **paymentStatus** 分别表示订单状态和支付状态

## 支付表（payments）

支付表存储与订单相关的所有支付记录。

| 字段名        | 类型   | 必填 | 描述                                             |
| ------------- | ------ | ---- | ------------------------------------------------ |
| \_id          | String | 是   | 文档唯一ID，系统自动生成                         |
| \_openid      | String | 是   | 用户的微信OpenID                                 |
| userId        | String | 是   | 关联的用户表ID                                   |
| orderId       | String | 是   | 关联的订单ID                                     |
| createTime    | Date   | 是   | 支付记录创建时间                                 |
| updateTime    | Date   | 是   | 支付记录更新时间                                 |
| paymentNo     | String | 是   | 支付编号，业务可读唯一编号                       |
| amount        | String | 是   | 支付金额，以字符串存储                           |
| paymentMethod | String | 是   | 支付方式：微信支付、余额支付、会员卡支付、现金等 |
| paymentTime   | Date   | 否   | 支付成功时间                                     |
| status        | String | 是   | 支付状态：处理中、成功、失败、已退款             |
| transactionId | String | 否   | 支付平台返回的交易ID                             |
| refundAmount  | String | 否   | 退款金额，以字符串存储                           |
| refundTime    | Date   | 否   | 退款时间                                         |
| refundReason  | String | 否   | 退款原因                                         |
| operatorId    | String | 否   | 操作人员ID（收银员、管理员）                     |

### 说明：

1. 一个订单可能有多个支付记录（部分支付、退款等）
2. **paymentMethod** 表示不同的支付方式
3. **status** 表示支付的当前状态
4. 退款相关字段只在发生退款时填写

## 表关系

- 一个用户（users表）可以有多个预约（appointments表）
- 一个用户可以有多个订单（orders表）
- 一个预约通常对应一个订单（appointments表通过orderId关联orders表）
- 一个订单可以有多个支付记录（orders表与payments表通过orderId关联）
- 订单和预约都关联到具体车辆（vehicles表）
- 订单项目通过itemId关联到服务项目（services表）或产品

## 安全控制

建议对各表设置如下安全规则：

- appointments表：仅创建者可读写，管理员可读写
- services表：所有用户可读，仅管理员可写
- orders表：仅创建者可读，管理员可读写
- payments表：仅创建者可读，管理员可读写

## 未来可能的扩展

1. **评价表**：记录用户对服务的评价和满意度
2. **会员卡表**：存储用户的会员卡信息
3. **优惠券表**：管理各类优惠券
4. **门店表**：管理多门店信息
5. **员工表**：管理服务人员信息
6. **产品表**：管理实体产品信息
