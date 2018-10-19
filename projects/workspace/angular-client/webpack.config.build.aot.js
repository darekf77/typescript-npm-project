const _ = require('lodash')
const merge = require('webpack-merge');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const ngcWebpack = require('ngc-webpack');
const common = require('./webpack.config.common.js');
const PurifyPlugin = require('@angular-devkit/build-optimizer').PurifyPlugin;

const { AngularCompilerPlugin } = require('@ngtools/webpack');

module.exports = merge(common, {
  plugins: [
    new ngcWebpack.NgcWebpackPlugin({
      AOT: false,                            // alias for skipCodeGeneration: false
      tsConfigPath: './src/tsconfig.app.json',
      mainPath: 'main.ts',
      platform: 0,
      hostReplacementPaths: {
        "environments/environment.ts": "environments/environment.prod.ts"
      },
      sourceMap: false
    }),
    // new PurifyPlugin(),
    new UglifyJSPlugin({
      uglifyOptions: {
        compress: {
          warnings: false,
          // drop_debugger: false
        }
      }
    })
  ],
  stats: 'errors-only'
});
