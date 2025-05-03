/**
 * 按数据表分组部署云函数脚本 - 独立依赖模式
 * 用法：
 * - 部署所有函数：node deploy-cloud-functions.js
 * - 部署特定分组：node deploy-cloud-functions.js services
 * - 部署单个函数：node deploy-cloud-functions.js function getUserOrders
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

// 扁平化所有云函数列表（用于验证）
const allFunctions = Object.values(functionGroups).flat();

// 云函数目录
const cloudFunctionsDir = path.join(__dirname, "cloudfunctions");

// 获取命令行参数
const deployType = process.argv[2];
const deployTarget = process.argv[3];

// 检查云函数文件夹是否存在
function checkFunctionExists(funcName) {
  const funcPath = path.join(cloudFunctionsDir, funcName);
  return fs.existsSync(funcPath);
}

// 检查并安装云函数依赖
function installDependencies(funcName) {
  const funcPath = path.join(cloudFunctionsDir, funcName);
  const packageJsonPath = path.join(funcPath, "package.json");

  if (fs.existsSync(packageJsonPath)) {
    console.log(`  安装 ${funcName} 的依赖...`);
    try {
      execSync("npm install", {
        cwd: funcPath,
        stdio: "inherit",
      });
      console.log(`  ✅ ${funcName} 依赖安装成功`);
    } catch (err) {
      console.error(`  ❌ ${funcName} 依赖安装失败:`, err.message);
      throw new Error(`依赖安装失败: ${err.message}`);
    }
  } else {
    console.log(`  ⚠️ ${funcName} 没有package.json文件`);
  }
}

// 部署云函数
function deployFunction(funcName) {
  console.log(`正在部署云函数: ${funcName}`);
  const funcPath = path.join(cloudFunctionsDir, funcName);

  try {
    // 先安装依赖
    installDependencies(funcName);

    // 部署云函数 - 使用云端安装依赖选项
    execSync(`cloudbase functions:deploy ${funcName} --force`, {
      stdio: "inherit",
    });
    console.log(`✅ 云函数 ${funcName} 部署成功`);
  } catch (error) {
    console.error(`❌ 云函数 ${funcName} 部署失败: ${error.message}`);
  }
}

// 主函数
function main() {
  // 验证云函数目录是否存在
  if (!fs.existsSync(cloudFunctionsDir)) {
    console.error("❌ 云函数目录不存在");
    process.exit(1);
  }

  // 获取所有实际存在的云函数
  const existingFunctions = fs
    .readdirSync(cloudFunctionsDir)
    .filter(
      (file) =>
        file !== "shared-deps" &&
        fs.statSync(path.join(cloudFunctionsDir, file)).isDirectory()
    );

  // 如果要部署单个函数
  if (deployType === "function" && deployTarget) {
    if (!checkFunctionExists(deployTarget)) {
      console.error(`❌ 云函数 "${deployTarget}" 不存在`);
      process.exit(1);
    }
    console.log(`准备部署单个云函数: ${deployTarget}`);
    deployFunction(deployTarget);
    return;
  }

  // 如果指定了分组
  if (deployType && functionGroups[deployType]) {
    const functionsToDeploy = functionGroups[deployType];
    console.log(
      `准备部署 ${deployType} 分组下的 ${functionsToDeploy.length} 个云函数:`
    );

    functionsToDeploy.forEach((funcName) => {
      if (checkFunctionExists(funcName)) {
        deployFunction(funcName);
      } else {
        console.warn(`⚠️ 云函数 ${funcName} 不存在，已跳过`);
      }
    });
  } else {
    // 部署所有云函数
    console.log(`准备部署所有云函数...`);

    existingFunctions.forEach((funcName) => {
      deployFunction(funcName);
    });
  }

  console.log("\n🎉 云函数部署任务完成");
  console.log("\n提示: 每个云函数现在使用独立依赖，确保稳定性");
}

main();
