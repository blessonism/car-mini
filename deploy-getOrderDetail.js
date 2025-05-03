/**
 * 部署getOrderDetail云函数的脚本
 */

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

// 云函数目录
const cloudFuncDir = path.join(__dirname, "cloudfunctions", "getOrderDetail");

console.log("开始部署getOrderDetail云函数...");

// 检查函数是否存在
if (!fs.existsSync(cloudFuncDir)) {
  console.error("❌ getOrderDetail云函数不存在！");
  process.exit(1);
}

try {
  // 安装依赖
  console.log("安装依赖...");
  execSync("npm install", {
    cwd: cloudFuncDir,
    stdio: "inherit",
  });

  // 部署云函数 - 使用云端安装依赖选项
  console.log("部署云函数...");
  execSync("cloudbase functions:deploy getOrderDetail --force", {
    stdio: "inherit",
  });

  console.log("✅ 云函数 getOrderDetail 部署成功");
} catch (error) {
  console.error(`❌ 云函数 getOrderDetail 部署失败: ${error.message}`);
  process.exit(1);
}
