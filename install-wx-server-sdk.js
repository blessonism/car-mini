/**
 * 为所有云函数安装wx-server-sdk依赖的脚本
 * 使用方法: node install-wx-server-sdk.js
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// 云函数目录
const CLOUD_FUNCTIONS_DIR = path.join(__dirname, "cloudfunctions");

// 需要排除的目录
const EXCLUDE_DIRS = ["shared-deps"];

console.log("开始为所有云函数安装wx-server-sdk依赖...");

// 获取所有云函数目录
const functionDirs = fs.readdirSync(CLOUD_FUNCTIONS_DIR).filter((dir) => {
  // 排除非目录和EXCLUDE_DIRS中的目录
  const stats = fs.statSync(path.join(CLOUD_FUNCTIONS_DIR, dir));
  return stats.isDirectory() && !EXCLUDE_DIRS.includes(dir);
});

console.log(`找到 ${functionDirs.length} 个云函数: ${functionDirs.join(", ")}`);

// 为每个云函数更新package.json并安装依赖
functionDirs.forEach((functionDir) => {
  const functionPath = path.join(CLOUD_FUNCTIONS_DIR, functionDir);
  const packageJsonPath = path.join(functionPath, "package.json");

  console.log(`\n处理云函数: ${functionDir}`);

  // 检查是否有package.json
  if (fs.existsSync(packageJsonPath)) {
    try {
      // 读取package.json
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

      // 确保有dependencies字段
      if (!packageJson.dependencies) {
        packageJson.dependencies = {};
      }

      // 添加wx-server-sdk依赖
      if (!packageJson.dependencies["wx-server-sdk"]) {
        packageJson.dependencies["wx-server-sdk"] = "^2.6.3";
        console.log(
          `  更新 ${functionDir} 的package.json，添加wx-server-sdk依赖`
        );

        // 写回package.json
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      } else {
        console.log(`  ${functionDir} 的package.json已包含wx-server-sdk依赖`);
      }

      // 安装依赖
      console.log(`  安装 ${functionDir} 的依赖...`);
      try {
        execSync("npm install", {
          cwd: functionPath,
          stdio: "inherit", // 显示安装过程
        });
        console.log(`  ✅ ${functionDir} 依赖安装成功`);
      } catch (err) {
        console.error(`  ❌ ${functionDir} 依赖安装失败:`, err.message);
      }
    } catch (err) {
      console.error(
        `  ❌ 处理 ${functionDir} 的package.json失败:`,
        err.message
      );
    }
  } else {
    // 如果没有package.json，创建一个基本的
    console.log(`  ${functionDir} 没有package.json文件，创建一个基本的`);
    const basicPackageJson = {
      name: functionDir,
      version: "1.0.0",
      description: `Cloud function for ${functionDir}`,
      main: "index.js",
      dependencies: {
        "wx-server-sdk": "^2.6.3",
      },
    };

    fs.writeFileSync(
      packageJsonPath,
      JSON.stringify(basicPackageJson, null, 2)
    );

    // 安装依赖
    console.log(`  安装 ${functionDir} 的依赖...`);
    try {
      execSync("npm install", {
        cwd: functionPath,
        stdio: "inherit",
      });
      console.log(`  ✅ ${functionDir} 依赖安装成功`);
    } catch (err) {
      console.error(`  ❌ ${functionDir} 依赖安装失败:`, err.message);
    }
  }
});

console.log("\n所有云函数依赖安装完成!");
console.log(
  "现在请打开微信开发者工具，对每个云函数使用'上传并部署：云端安装依赖'选项"
);
console.log("另外，您可以删除之前的shared-deps目录，它不再需要");
