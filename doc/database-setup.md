# 数据库设置指南

本文档提供了如何在微信云开发中设置数据库集合和安全规则的步骤。

## 1. 创建数据库集合

1. 打开微信开发者工具
2. 选择云开发控制台
3. 点击"数据库"选项
4. 创建以下两个集合：
   - `users` - 存储用户信息
   - `vehicles` - 存储车辆信息

## 2. 设置索引（可选但推荐）

为提高查询效率，建议设置以下索引：

### users 集合索引

1. 在 users 集合中，创建 `_openid` 字段的索引：
   - 字段：\_openid
   - 索引方向：升序 (1)
   - 索引名称：openid_idx

### vehicles 集合索引

1. 在 vehicles 集合中，创建 `_openid` 字段的索引：

   - 字段：\_openid
   - 索引方向：升序 (1)
   - 索引名称：openid_idx

2. 在 vehicles 集合中，创建 `userId` 字段的索引：
   - 字段：userId
   - 索引方向：升序 (1)
   - 索引名称：userId_idx

## 3. 设置安全规则

为了保护数据安全，需要为每个集合设置适当的安全规则。

### users 集合安全规则

```json
{
  "read": "doc._openid == auth.openid",
  "write": "doc._openid == auth.openid"
}
```

这条规则确保用户只能读取和修改自己的信息。

### vehicles 集合安全规则

```json
{
  "read": true,
  "write": "doc._openid == auth.openid"
}
```

这条规则允许所有已登录用户查看所有车辆信息，但只有车辆的创建者可以修改或删除。

> 注意：如果需要更严格的权限控制，可以将vehicles表的读取权限也设置为仅创建者可读：
>
> ```json
> {
>   "read": "doc._openid == auth.openid",
>   "write": "doc._openid == auth.openid"
> }
> ```

## 4. 部署云函数

确保以下云函数已正确部署：

1. login - 用户登录
2. getUserInfo - 获取用户信息
3. updateUserInfo - 更新用户信息
4. getUserVehicles - 获取用户车辆信息
5. updateUserVehicles - 添加/更新/删除车辆信息
6. getPhoneNumber - 获取用户手机号码

部署步骤：

1. 在微信开发者工具中右键点击需要部署的云函数文件夹
2. 选择"上传并部署：云端安装依赖"
3. 等待部署完成

## 5. 数据迁移（如需从旧版本升级）

如果您之前的应用中车辆信息存储在用户表中的vehicles数组中，请执行以下数据迁移：

1. 创建一个临时云函数 `migrateVehicles`
2. 实现以下逻辑：
   - 获取所有包含vehicles数组的用户
   - 将每个车辆信息创建为vehicles表中的独立记录
   - 更新用户记录，移除vehicles数组

迁移完成后可以删除临时云函数。

## 6. 验证设置

完成设置后：

1. 测试用户注册/登录
2. 测试添加/编辑/删除车辆
3. 确认数据正确存储在相应的集合中
4. 确认安全规则正常工作，保护数据安全
