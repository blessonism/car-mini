// 云函数入口文件
const cloud = require("wx-server-sdk");

cloud.init({
  env: "cloud1-0grrc4znc15e5fde",
});

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const {
    name,
    description,
    category,
    price,
    duration,
    coverImage = "",
    isActive = true,
    sortOrder = 0,
  } = event;

  // 验证必要字段
  if (!name || !description || !category || !price || !duration) {
    return {
      success: false,
      message: "缺少必要字段",
    };
  }

  try {
    const now = new Date();

    // 创建服务项目
    const result = await db.collection("services").add({
      data: {
        name,
        description,
        category,
        price,
        duration,
        coverImage,
        isActive,
        sortOrder,
        createTime: now,
        updateTime: now,
      },
    });

    return {
      success: true,
      data: {
        _id: result._id,
      },
      message: "添加服务项目成功",
    };
  } catch (err) {
    return {
      success: false,
      message: "添加服务项目失败",
      error: err,
    };
  }
};
