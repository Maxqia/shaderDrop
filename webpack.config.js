const path = require('path');

module.exports = {
  mode: 'development',
  devtool: 'eval-source-map',
  entry: {
    xtermclient: './xtermclient.js',
    scanner: './scanner.js'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
  },
  node: { // https://github.com/webpack-contrib/css-loader/issues/447
    fs: "empty"
  },
  devServer: {
    https: true,
    contentBase: path.join(__dirname, 'public'),
  },
};
