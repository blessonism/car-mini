const { UnifiedWebpackPluginV5 } = require('weapp-tailwindcss-webpack-plugin');
const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const autoprefixer = require('autoprefixer');

// 处理wxss文件的函数
async function processWxss(filePath) {
  try {
    // 注意: 不直接使用 tailwindcss，而是通过 plugin 方法导入
    const content = fs.readFileSync(filePath, 'utf8');
    const processor = postcss([
      require('tailwindcss/plugin')(),
      autoprefixer,
      // 不在这里处理，交给微信开发者工具的 webpack 处理
    ]);
    
    const result = await processor.process(content, { from: filePath, to: filePath });
    fs.writeFileSync(filePath, result.css, 'utf8');
    console.log(`Processed: ${filePath}`);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

// 递归处理目录中的所有wxss文件
function processDir(dirPath) {
  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);
    

    if (stat.isDirectory()) {
      processDir(fullPath);
    } else if (file.endsWith('.wxss')) {
      processWxss(fullPath);
    }
  }
}

// 开始处理
console.log('开始处理 Tailwind CSS');
console.log('注意: 还需在微信开发者工具中使用自定义编译模式');
console.log('在开发者工具中选择: 详情 -> 本地设置 -> 启用自定义编译');
console.log('并指定 webpack 配置文件为 weapp.webpack.js');

// 处理主样式文件
(async () => {
  try {
    await processWxss('./miniprogram/tailwind.wxss');
    console.log('Tailwind 主文件处理完成!');
  } catch (error) {
    console.error('处理失败:', error.message);
  }
})(); 