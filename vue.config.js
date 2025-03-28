const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  configureWebpack: {
    module: {
      rules: [
        {
          test: /\.d.ts$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'ignore-loader'
            }
          ]
        }
      ]
    }
  }
})
