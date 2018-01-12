import * as fs from 'fs'
import * as _ from 'lodash'
import * as path from 'path'
import * as WebpackOnBuildPlugin from 'on-build-webpack';
import * as WebpackPreBuildPlugin from 'pre-build-webpack';
import * as child from 'child_process';
import * as webpack from 'webpack';
import { run } from "../helpers";

import config from "../config";




//#region handle node modules
const nodeModules = {};
fs.readdirSync('node_modules')
    .filter(function (x) {
        return ['.bin'].indexOf(x) === -1;
    })
    .forEach(function (mod) {
        nodeModules[mod] = 'commonjs ' + mod;
    });
//#endregion

module.exports = env => {
    _.forIn(env, (v, k) => {
        if(v === 'true') env[k] = true;
        if(v === 'false') env[k] = false;
    })
    let buildOk = true;
    const filename = (env.isWatch ? config.folder.watchDist : config.folder.bundle) + config.templateFiles.clientJS.name;
    const outDir = path.join(process.cwd(), (env.isWatch ? config.folder.watchDist : config.folder.bundle));
    console.log('env: ' + JSON.stringify(env))
    console.log('outDir: ' + outDir)
    return {
        //#region config
        entry: './src/index.ts',
        output: {
            filename,
            libraryTarget: "commonjs"
        },
        resolve: {
            extensions: ['.ts', '.js']
        },
        externals: nodeModules,
        node: {
            fs: "empty",
            __dirname: false,
            __filename: false
        },
        //#endregion
        //#region modules
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    loader: [
                        'isomorphic-region-loader',
                        {
                            "loader": "@ngtools/webpack",
                            "options": {
                                "tsConfigPath": "tsconfig.json",
                            }
                        }
                    ]
                },
                {
                    test: /\.js$/,
                    loader: [
                        'isomorphic-region-loader'
                    ]
                }
            ]
        },
        //#endregion
        plugins: [
            new WebpackPreBuildPlugin(function (stats) {
                const tscCommand = `npm-run tsc --pretty --outDir ${outDir}`;
                try {
                    run(tscCommand).sync.inProject()
                    console.log('Typescript compilation OK')
                } catch (error) {
                    console.error('Typescript compilation ERROR')
                    buildOk = false;
                }
            }),
            new WebpackOnBuildPlugin(function (stats) {
                if (env.isWatch && buildOk) {
                    config.templateFiles.clientJS.createFrom(path.join(outDir, config.templateFiles.clientJS.name))
                    config.templateFiles.clientDts.createFrom(path.join(outDir, config.templateFiles.clientDts.name))
                    config.templateFiles.indexDts.create()
                    config.templateFiles.indexJS.create()
                    config.templateFiles.indexJSmap.create()
                }
            }),
        ],
        stats: env.isWatch ? "none" : "normal"

    }

}
