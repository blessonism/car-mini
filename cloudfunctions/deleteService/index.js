// 云函数入口文件
const cloud = require("wx-server-sdk");

cloud.init({
  env: "cloud1-0grrc4znc15e5fde",
});

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const { _id } = event;

  // 验证必要字段
  if (!_id) {
    return {
      success: false,
      message: "缺少服务ID",
    };
  }

  try {
    // 将服务项目标记为非活跃，而不是物理删除
    // 这样可以保留历史数据，避免意外删除的风险
    await db
      .collection("services")
      .doc(_id)
      .update({
        data: {
          isActive: false,
          updateTime: new Date(),
        },
      });

    return {
      success: true,
      message: "删除服务项目成功",
    };
  } catch (err) {
    return {
      success: false,
      message: "删除服务项目失败",
      error: err,
    };
  }
};
