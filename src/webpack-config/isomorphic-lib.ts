// global
import * as path from 'path'
import * as child from 'child_process';
import * as dateformat from "dateformat";
// webpack plugins
import * as WebpackOnBuildPlugin from 'on-build-webpack';
import * as WebpackPreBuildPlugin from 'pre-build-webpack';
// local libs
import { copyFile, fixWebpackEnv } from "../helpers";
import { run } from "../process";
import { Project } from "../project";
import { BuildOptions } from "../models";
import config from "../config";

module.exports = (env: BuildOptions) => {
    fixWebpackEnv(env);
    let buildOk = true;
    const filename = (env.outDir) + '/client.js';

    return {
        entry: `./${config.folder.tempSrc}/index.ts`,
        output: {
            filename,
            libraryTarget: "commonjs"
        },
        resolve: {
            extensions: ['.ts', '.js']
        },
        externals: [function (context, req, cb) {
            !/^\./.test(req)
                ? cb(null, req)
                : cb(null, false);
        }],
        node: {
            fs: 'empty',
            __dirname: false,
            __filename: false
        },
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    loader: [
                        {
                            "loader": "@ngtools/webpack",
                            "options": {
                                "tsConfigPath": "tsconfig.json",
                            }
                        }
                    ]
                }
            ]
        },
        plugins: [
            new WebpackPreBuildPlugin(function (stats) {
                const date = `[${dateformat(new Date(), 'HH:MM:ss')}]`;
                try {
                    run(`npm-run tsc --outDir ${env.outDir}`).sync();
                    run(`npm-run tnp create:temp:src`, { cwd: process.cwd() }).sync();
                    console.log(`${date} Typescript compilation OK`)
                } catch (error) {
                    console.error(`${date} Typescript compilation ERROR`)
                    buildOk = false;
                }
            })
        ],
        stats: "normal"

    }

}
