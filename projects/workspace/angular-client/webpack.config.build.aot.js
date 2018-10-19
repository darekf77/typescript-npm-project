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
  "devServer": {
    quiet: true, // needed for friend output
    noInfo: true,
    "stats": {
      assets: false,
      cached: false,
      cachedAssets: false,
      children: false,
      chunks: false,
      chunkModules: false,
      chunkOrigins: false,
      colors: false,
      depth: false,
      entrypoints: false,
      errors: true,
      errorDetails: true,
      hash: false,
      maxModules: 0,
      modules: false,
      performance: false,
      providedExports: false,
      publicPath: false,
      reasons: false,
      source: false,
      timings: false,
      usedExports: false,
      version: false,
      warnings: false
    }
  }
});
