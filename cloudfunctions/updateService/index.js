// 云函数入口文件
const cloud = require("wx-server-sdk");

cloud.init({
  env: "cloud1-0grrc4znc15e5fde",
});

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const {
    _id,
    name,
    description,
    category,
    price,
    duration,
    coverImage,
    isActive,
    sortOrder,
  } = event;

  // 验证必要字段
  if (!_id) {
    return {
      success: false,
      message: "缺少服务ID",
    };
  }

  try {
    // 构建要更新的数据对象
    const updateData = {};

    // 只更新传入的字段
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (price !== undefined) updateData.price = price;
    if (duration !== undefined) updateData.duration = duration;
    if (coverImage !== undefined) updateData.coverImage = coverImage;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

    // 添加更新时间
    updateData.updateTime = new Date();

    // 更新服务项目
    await db.collection("services").doc(_id).update({
      data: updateData,
    });

    return {
      success: true,
      message: "更新服务项目成功",
    };
  } catch (err) {
    return {
      success: false,
      message: "更新服务项目失败",
      error: err,
    };
  }
};
