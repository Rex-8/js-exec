const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
    library: 'JSExec',
    libraryTarget: 'umd',
    libraryExport: 'default',
    globalObject: 'this'
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/iframe.html',
      filename: 'iframe.html',
      inject: false
    })
  ],
  mode: 'development'
};
