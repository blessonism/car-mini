// 云函数入口文件
const cloud = require("wx-server-sdk");

cloud.init({
  env: "cloud1-0grrc4znc15e5fde",
});

const db = cloud.database();
const _ = db.command;

// 云函数入口函数
exports.main = async (event, context) => {
  const { category, isActive = true } = event;

  try {
    // 构建查询条件
    const condition = {};

    // 默认只返回活跃的服务
    if (isActive !== undefined) {
      condition.isActive = isActive;
    }

    // 如果指定了类别，则按类别筛选
    if (category) {
      condition.category = category;
    }

    // 查询服务列表，按sortOrder排序
    const { data } = await db
      .collection("services")
      .where(condition)
      .orderBy("sortOrder", "asc")
      .get();

    return {
      success: true,
      data: data,
      message: "获取服务列表成功",
    };
  } catch (err) {
    return {
      success: false,
      message: "获取服务列表失败",
      error: err,
    };
  }
};
