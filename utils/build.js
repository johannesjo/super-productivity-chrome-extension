var webpack = require("webpack"),
  config = require("../webpack.config");

delete config.chromeExtensionBoilerplate;

// always build for production
process.env.NODE_ENV = 'production';

webpack(
  config,
  function(err) {
    if (err) throw err;
  }
);
