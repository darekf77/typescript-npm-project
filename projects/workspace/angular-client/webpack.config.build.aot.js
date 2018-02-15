const _ = require('lodash')
const merge = require('webpack-merge');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const ngcWebpack = require('ngc-webpack');
const common = require('./webpack.config.common.js');

const isomorphic = require('isomorphic-lib')

const classNames = [
  ...Object.keys(isomorphic.Controllers).map(k => isomorphic.Controllers[k].name),
  ...Object.keys(isomorphic.Entities).map(k => isomorphic.Entities[k].name)
]

const { AngularCompilerPlugin } = require('@ngtools/webpack');

module.exports = merge(common, {
  plugins: [
    new UglifyJSPlugin({
      uglifyOptions: {
        mangle: {
          reserved: classNames
        }
      }
    }),
    new ngcWebpack.NgcWebpackPlugin({
      AOT: true,                            // alias for skipCodeGeneration: false
      tsConfigPath: './src/tsconfig.app.json',
      mainPath: 'main.ts'               // will auto-detect the root NgModule.
    })
  ]
});
