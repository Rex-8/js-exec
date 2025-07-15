const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
    library: {
      name: 'JSExec',
      type: 'umd'
    },
    globalObject: 'this'
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/iframe.html',
      filename: 'iframe.html',
      inject: false
    })
  ],
  mode: 'development',
  resolve: {
    fallback: {
      "fs": false,
      "path": false,
      "os": false
    }
  }
};