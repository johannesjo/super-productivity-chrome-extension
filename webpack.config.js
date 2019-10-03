const webpack = require('webpack'),
  path = require('path'),
  fileSystem = require('fs'),
  env = require('./utils/env'),
  CleanWebpackPlugin = require('clean-webpack-plugin'),
  CopyWebpackPlugin = require('copy-webpack-plugin'),
  HtmlWebpackPlugin = require('html-webpack-plugin'),
  WriteFilePlugin = require('write-file-webpack-plugin');

// load the secrets
const alias = {};

const cfgPath = path.join(__dirname, ('cfg.' + env.NODE_ENV + '.js'));
const secretsPath = path.join(__dirname, ('secrets.' + env.NODE_ENV + '.js'));

const fileExtensions = ['jpg', 'jpeg', 'png', 'gif', 'eot', 'otf', 'svg', 'ttf', 'woff', 'woff2'];

if (fileSystem.existsSync(cfgPath)) {
  alias['cfg'] = cfgPath;
}

if (fileSystem.existsSync(secretsPath)) {
  alias['secrets'] = secretsPath;
}

const IS_DEV = (env.NODE_ENV === 'development');

const options = {
  entry: {
    // popup: path.join(__dirname, 'src', 'js', 'popup.js'),
    // options: path.join(__dirname, 'src', 'js', 'options.js'),
    background: path.join(__dirname, 'src', 'js', 'background.js'),
    frontendInterface: path.join(__dirname, 'src', 'js', 'frontendInterface.js')
  },
  chromeExtensionBoilerplate: {
    notHotReload: ['frontendInterface']
  },
  output: {
    path: path.join(__dirname, 'build'),
    filename: '[name].bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        loader: 'style-loader!css-loader',
        exclude: /node_modules/
      },
      {
        test: new RegExp('\.(' + fileExtensions.join('|') + ')$'),
        loader: 'file-loader?name=[name].[ext]',
        exclude: /node_modules/
      },
      {
        test: /\.html$/,
        loader: 'html-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    alias: alias,
  },
  plugins: [
    // clean the build folder
    new CleanWebpackPlugin(['build']),
    // expose and write the allowed env vars on the compiled bundle
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(env.NODE_ENV)
    }),
    new CopyWebpackPlugin([{
      from: 'src/manifest.json',
      transform: function(content, path) {
        // generates the manifest file using the package.json informations
        const manifestData = Object.assign({
          description: process.env.npm_package_description,
          version: process.env.npm_package_version,
        }, JSON.parse(content.toString()));
        return Buffer.from(JSON.stringify(manifestData))
      }
    }]),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'popup.html'),
      filename: 'popup.html',
      chunks: ['popup']
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'options.html'),
      filename: 'options.html',
      chunks: ['options']
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'background.html'),
      filename: 'background.html',
      chunks: ['background']
    }),
    new WriteFilePlugin()
  ]
};

if (IS_DEV) {
  options.devtool = 'cheap-module-eval-source-map';
}

module.exports = options;
