const { UnifiedWebpackPluginV5 } = require('weapp-tailwindcss-webpack-plugin')

// 注意：下面的导出格式是为了配合微信小程序开发者工具的构建配置
module.exports = {
  plugins: [
    new UnifiedWebpackPluginV5({
      appType: 'wx',
      rem2rpx: true,
    })
  ]
} 