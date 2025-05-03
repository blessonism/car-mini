/**
 * 云函数依赖安装脚本
 * 用于安装所有云函数的依赖
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// 云函数目录
const CLOUD_FUNCTIONS_DIR = path.join(__dirname, "cloudfunctions");

console.log("开始安装云函数依赖...");

// 获取所有云函数目录
const functionDirs = fs.readdirSync(CLOUD_FUNCTIONS_DIR).filter((dir) => {
  // 排除shared-deps和非目录
  const stats = fs.statSync(path.join(CLOUD_FUNCTIONS_DIR, dir));
  return stats.isDirectory() && dir !== "shared-deps";
});

console.log(`找到 ${functionDirs.length} 个云函数: ${functionDirs.join(", ")}`);

// 为每个云函数安装依赖
functionDirs.forEach((functionDir) => {
  const functionPath = path.join(CLOUD_FUNCTIONS_DIR, functionDir);
  const packageJsonPath = path.join(functionPath, "package.json");

  // 检查是否有package.json
  if (fs.existsSync(packageJsonPath)) {
    console.log(`\n安装 ${functionDir} 的依赖...`);
    try {
      // 在云函数目录中执行 npm install
      execSync("npm install", {
        cwd: functionPath,
        stdio: "inherit", // 显示安装过程
      });
      console.log(`✅ ${functionDir} 依赖安装成功`);
    } catch (err) {
      console.error(`❌ ${functionDir} 依赖安装失败:`, err.message);
    }
  } else {
    console.log(`⚠️ ${functionDir} 没有package.json文件，跳过`);
  }
});

console.log("\n所有云函数依赖安装完成!");
console.log("提示: 请确保所有云函数都已重新上传到云端");
