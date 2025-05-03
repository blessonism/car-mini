/**
 * 优化的云函数依赖安装脚本 - 使用共享依赖方式
 * 用法：
 * - 安装所有公共依赖：node install-cloud-functions.js
 * - 安装特定分组依赖：node install-cloud-functions.js services
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// 云函数按数据表分组
const functionGroups = {
  // 服务相关云函数
  services: ["getServices", "addService", "updateService", "deleteService"],

  // 预约相关云函数
  appointments: [
    "getUserAppointments",
    "createAppointment",
    "updateAppointmentStatus",
  ],

  // 订单相关云函数
  orders: ["createOrderFromAppointment", "getUserOrders", "updateOrderStatus"],

  // 支付相关云函数
  payments: ["createPayment"],

  // 用户相关云函数
  users: ["login", "getUserInfo", "updateUserInfo", "getPhoneNumber"],

  // 车辆相关云函数
  vehicles: ["getUserVehicles", "updateUserVehicles"],
};

// 云函数目录
const cloudFunctionsDir = path.join(__dirname, "cloudfunctions");

// 共享依赖目录 (用于存放所有云函数共用的依赖)
const sharedDepsDir = path.join(cloudFunctionsDir, "shared-deps");

// 获取要安装依赖的云函数组
const groupToInstall = process.argv[2];

// 检查云函数文件夹是否存在
function checkFunctionExists(funcName) {
  const funcPath = path.join(cloudFunctionsDir, funcName);
  return fs.existsSync(funcPath);
}

// 创建共享依赖目录和package.json
function setupSharedDeps() {
  // 确保共享依赖目录存在
  if (!fs.existsSync(sharedDepsDir)) {
    console.log(`创建共享依赖目录: ${sharedDepsDir}`);
    fs.mkdirSync(sharedDepsDir, { recursive: true });
  }

  // 创建或更新共享依赖的package.json
  const packageJsonPath = path.join(sharedDepsDir, "package.json");
  const packageJson = {
    name: "shared-dependencies",
    version: "1.0.0",
    description: "共享依赖模块，用于所有云函数",
    dependencies: {
      "wx-server-sdk": "^2.6.3",
    },
  };

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log("已创建共享依赖配置文件");

  // 安装共享依赖
  console.log("开始安装共享依赖...");
  try {
    execSync(`cd ${sharedDepsDir} && npm install`, { stdio: "inherit" });
    console.log("✅ 共享依赖安装成功");
  } catch (error) {
    console.error(`❌ 共享依赖安装失败: ${error.message}`);
    process.exit(1);
  }
}

// 为云函数创建基本文件结构和依赖引用
function setupCloudFunction(funcName) {
  const funcPath = path.join(cloudFunctionsDir, funcName);

  console.log(`配置云函数: ${funcName}`);

  try {
    // 确保云函数目录存在
    if (!fs.existsSync(funcPath)) {
      fs.mkdirSync(funcPath, { recursive: true });
    }

    // 创建简化的package.json - 仅包含特定云函数需要的依赖
    const packageJsonPath = path.join(funcPath, "package.json");
    const packageJson = {
      name: funcName,
      version: "1.0.0",
      description: `Cloud function for ${funcName}`,
      main: "index.js",
      dependencies: {
        // 引用共享依赖文件夹中的wx-server-sdk，避免重复安装
        // 特定于此云函数的其他依赖可以在这里添加
      },
    };

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

    // 创建package.json的符号链接到共享依赖目录的node_modules
    const nodeModulesPath = path.join(funcPath, "node_modules");
    if (!fs.existsSync(nodeModulesPath)) {
      // 在Windows下创建文件夹链接，在Linux/Mac下创建符号链接
      if (process.platform === "win32") {
        // 为确保共享依赖工作，复制node_modules而不是创建符号链接
        execSync(
          `xcopy "${path.join(sharedDepsDir, "node_modules")}" "${nodeModulesPath}" /E /I /H /Y`
        );
      } else {
        execSync(
          `ln -sf "${path.join(sharedDepsDir, "node_modules")}" "${nodeModulesPath}"`
        );
      }
    }

    console.log(`✅ 云函数 ${funcName} 依赖配置完成`);
  } catch (error) {
    console.error(`❌ 云函数 ${funcName} 依赖配置失败: ${error.message}`);
  }
}

// 主函数
function main() {
  // 验证云函数目录是否存在
  if (!fs.existsSync(cloudFunctionsDir)) {
    console.error("❌ 云函数目录不存在");
    process.exit(1);
  }

  // 安装共享依赖
  setupSharedDeps();

  // 获取所有实际存在的云函数
  const existingFunctions = fs
    .readdirSync(cloudFunctionsDir)
    .filter(
      (file) =>
        file !== "shared-deps" &&
        fs.statSync(path.join(cloudFunctionsDir, file)).isDirectory()
    );

  // 如果指定了分组
  if (groupToInstall) {
    if (!functionGroups[groupToInstall]) {
      console.error(`❌ 云函数分组 "${groupToInstall}" 不存在`);
      console.log(`可用的分组: ${Object.keys(functionGroups).join(", ")}`);
      process.exit(1);
    }

    const functionsToInstall = functionGroups[groupToInstall];
    console.log(
      `准备为 ${groupToInstall} 分组下的 ${functionsToInstall.length} 个云函数配置依赖:`
    );

    functionsToInstall.forEach((funcName) => {
      if (checkFunctionExists(funcName)) {
        setupCloudFunction(funcName);
      } else {
        console.warn(`⚠️ 云函数 ${funcName} 不存在，已跳过`);
      }
    });
  } else {
    // 为所有云函数配置依赖
    console.log(`准备为所有云函数配置依赖...`);

    existingFunctions.forEach((funcName) => {
      setupCloudFunction(funcName);
    });
  }

  console.log("\n🎉 云函数依赖配置任务完成");
  console.log("\n提示：");
  console.log("1. 共享依赖方式可以大幅减少云函数大小和部署时间");
  console.log("2. 使用 'node deploy-cloud-functions.js' 部署云函数");
  console.log("3. 如需添加特定依赖，请在相应云函数的package.json中手动添加");
}

main();
