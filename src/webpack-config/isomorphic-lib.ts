import * as fs from 'fs'
import * as _ from 'lodash'
import * as path from 'path'
import * as WebpackOnBuildPlugin from 'on-build-webpack';
import * as WebpackPreBuildPlugin from 'pre-build-webpack';
import * as child from 'child_process';
import { copy } from "../helpers";
import { run } from "../process";
import { Project } from "../project";
import { BuildOptions } from "../models";

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


module.exports = (env: BuildOptions) => {
    _.forIn(env, (v, k) => {
        const value: string = v as any;
        if (value === 'true') env[k] = true;
        if (value === 'false') env[k] = false;
    })
    let buildOk = true;

    const filename = (env.watch ? config.folder.watchDist : config.folder.bundle) + 'client.js';
    const outDir = env.watch ? config.folder.watchDist : config.folder.bundle;
    
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
                Project.Current
                    .filesToRecreateBeforeBuild()
                    .forEach(file => copy(file.from, file.where));
                const tscCommand = `npm-run tsc --outDir ${outDir}`;
                try {
                    run(tscCommand).sync();
                    console.log('Typescript compilation OK')
                } catch (error) {
                    console.error('Typescript compilation ERROR')
                    buildOk = false;
                }
            }),
            new WebpackOnBuildPlugin(function (stats) {
                if (env.watch && buildOk) {
                    Project.Current
                        .filesToRecreateAfterBuild()
                        .forEach(file => {
                            copy(file.from, file.where)
                        });
                }
            }),
        ],
        stats: env.watch ? "none" : "normal"

    }

}
