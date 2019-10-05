const path = require('path');
var fs = require('fs');

module.exports = {
  mode: 'development',
  devtool: 'eval-source-map',
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use : {
          loader: "babel-loader",
        },
      },
      {
        test: /\.(scss)$/,
        use: [{
          loader: 'style-loader', // inject CSS to page
        }, {
          loader: 'css-loader', // translates CSS into CommonJS modules
        }, {
          loader: 'postcss-loader', // Run post css actions
          options: {
            plugins: function () { // post css plugins, can be exported to postcss.config.js
              return [
                require('precss'),
                require('autoprefixer')
              ];
            }
          }
        }, {
          loader: 'sass-loader' // compiles Sass to CSS
        }],
      },
    ],
  },
  entry: {
    xtermclient: './src/xtermclient.js',
    scanner: './src/scanner.js'
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
    host: '0.0.0.0',
    contentBase: path.join(__dirname, 'public'),
    disableHostCheck: true,
    proxy: {
      '/websocket': {
        target: 'ws://localhost:8081',
        ws: true,
      },
    },
  },
};
