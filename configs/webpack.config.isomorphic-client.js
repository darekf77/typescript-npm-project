const fs = require('fs');
const path = require('path');
const WebpackOnBuildPlugin = require('on-build-webpack');
const child = require('child_process');

const clientFile = 'client.js';

const nodeModules = {};
fs.readdirSync('node_modules')
    .filter(function (x) {
        return ['.bin'].indexOf(x) === -1;
    })
    .forEach(function (mod) {
        nodeModules[mod] = 'commonjs ' + mod;
    });

module.exports = {
    entry: './src/index.ts',
    output: {
        filename: clientFile
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

    plugins: [
        new WebpackOnBuildPlugin(function (stats) {
            const tscOut = path.join(process.cwd(), 'bundle');
            const tscCommand = `npm-run tsc  --pretty  --outDir ${tscOut}`;
            child.execSync('cd ' + process.cwd() + ' && ' + tscCommand, { stdio: [0, 1, 2] });
            fs.writeFileSync(path.join(tscOut, clientFile), fs.readFileSync(path.join(process.cwd(), clientFile)));
        }),
    ]
}

