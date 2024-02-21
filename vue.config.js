const { defineConfig } = require('@vue/cli-service')
const {resolve} = require("@babel/core/lib/vendor/import-meta-resolve");
module.exports = defineConfig({
  transpileDependencies: true,
  devServer:{
    port:8082,
  },
  configureWebpack: {
    module: {
      rules: [
        {
          test: /\.m?js$/,
          exclude: /(node_modules|bower_components)/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env']
            }
          }
        }
      ]
    }
  },
})
