import * as fs from 'fs'
import * as _ from 'lodash'
import * as path from 'path'


// import { NgcWebpackPlugin, NgcWebpackPluginOptions } from "ngc-webpack";

// const options: NgcWebpackPluginOptions = {
//     AOT: true,                            // alias for skipCodeGeneration: false
//     tsConfigPath: './tsconfig.watch.json',
//     mainPath: 'src/main.ts'               // will auto-detect the root NgModule.
// } as any;

// module.exports = env => {

//     return {
//         //#region config
//         entry: './components/src/index.ts',
//         output: {
//             filename: 'index.js',
//             libraryTarget: "commonjs"
//         },
//         resolve: {
//             extensions: ['.ts', '.js']
//         },
//         node: {
//             fs: "empty",
//             __dirname: false,
//             __filename: false
//         },
//         //#endregion
//         module: {
//             rules: [
//                 {
//                     test: /(?:\.ngfactory\.js|\.ngstyle\.js|\.ts)$/,
//                     use: ['@ngtools/webpack']
//                 }
//             ]
//         },
//         plugins: [
//             new NgcWebpackPlugin(options)
//         ]

//     }

// }
