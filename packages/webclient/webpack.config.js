const webpack = require('webpack');
const path = require('path');
var fs = require('fs');

var childProcess = require('child_process');
var version = childProcess.execSync('git describe --dirty').toString();
console.log(version);

module.exports = {
  mode: 'development',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
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
            postcssOptions: {
              plugins: function () { // post css plugins, can be exported to postcss.config.js
                return [
                  require('precss'),
                  require('autoprefixer')
                ];
              },
            },
          },
        }, {
          loader: 'sass-loader' // compiles Sass to CSS
        }],
      },
    ],
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.jsx', '.js', '.json' ],
  },
  entry: {
    index: './src/index.tsx',
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
    historyApiFallback: true,
    proxy: {
      '/websocket': {
        target: 'ws://localhost:8081',
        ws: true,
      },
    },
  },
  plugins: [
    new webpack.DefinePlugin({
      __VERSION__: JSON.stringify(version),
    }),
  ],
};
