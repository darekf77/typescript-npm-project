const _ = require('lodash')
const merge = require('webpack-merge');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const { AngularCompilerPlugin } = require('@ngtools/webpack');
const ngcWebpack = require('ngc-webpack');
const common = require('./webpack.config.common.js');

const { getReservedClassNames } = require('tnp-bundle')

let reserved = getReservedClassNames()
reserved = reserved.concat(['BaseCRUD', 'ModelDataConfig'])

console.log('reserved',reserved)

module.exports = merge(common, {
  plugins: [
    new AngularCompilerPlugin({
      "mainPath": "main.ts",
      "platform": 0,
      "hostReplacementPaths": {
        "environments/environment.ts": "environments/environment.ts"
      },
      "sourceMap": true,
      "tsConfigPath": "src/tsconfig.app.json",
      "skipCodeGeneration": true,
      "compilerOptions": {}
    }),
    new UglifyJSPlugin({
      uglifyOptions: {
        mangle: {
          reserved
        }
      }
    })
  ],
  stats: {
    modules: false,
  }
});
