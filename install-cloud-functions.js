// 安装所有云函数的脚本
const fs = require("fs");
const { execSync } = require("child_process");
const path = require("path");

// 云函数目录
const cloudFunctionsDir = path.join(__dirname, "cloudfunctions");

// 获取所有云函数名称
const cloudFunctions = fs.readdirSync(cloudFunctionsDir).filter((dir) => {
  return fs.statSync(path.join(cloudFunctionsDir, dir)).isDirectory();
});

console.log("即将安装以下云函数:");
cloudFunctions.forEach((func) => {
  console.log(`- ${func}`);
});

console.log("\n开始安装云函数...");

// 安装云函数依赖并部署
cloudFunctions.forEach((func) => {
  const funcDir = path.join(cloudFunctionsDir, func);

  console.log(`\n正在处理云函数: ${func}`);

  // 安装依赖
  console.log(`  安装依赖...`);
  try {
    process.chdir(funcDir);
    execSync("npm install", { stdio: "inherit" });
    console.log(`  依赖安装完成.`);
  } catch (error) {
    console.error(`  依赖安装失败: ${error.message}`);
  }
});

console.log("\n云函数依赖安装完成!");
console.log("\n请在微信开发者工具中手动上传这些云函数。");
console.log(
  "上传方法: 右键点击云函数目录 -> 上传并部署: 云端安装依赖(不上传node_modules)"
);
