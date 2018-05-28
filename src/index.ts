import * as _ from 'lodash';
import glob = require('glob')
import * as path from 'path';
import { run as runCommand } from "./process";
export { config } from './config';
export * from './helpers'
export * from './helpers-isomorphic'
export * from './project'
export * from './models'
import { Helpers } from "morphi";
import { paramsFrom, match } from './helpers';
import { isString } from 'util';
import chalk from 'chalk';
import { initWatcherDB } from "./watcher-no-race";




Helpers.checkEnvironment({
    npm: [
        { name: 'watch', version: '1.0.2' },
        { name: 'check-node-version' },
        { name: 'npm-run' },
        { name: 'cpr' }
    ],
    programs: [
        {
            name: 'code',
            website: 'https://code.visualstudio.com/'
        }
    ]
});

const localLibs = [
    'cpr',
    'eslint',
    'mkdirp',
    'gulp',
    'npm-run',
    'rimraf',
    'nodemon',
    'release-it',
    'tsc',
    'watch',
    'http-server',
    'ts-node',
    'sort-package-json',
    'concurrently',
    'sloc',
    'morphi'
]

const helpAlias = [
    '-h',
    '--help',
    '-help',
    'help'
]

export async function run(argsv: string[]) {

    let recognized = false;
    if (Array.isArray(argsv) && argsv.length >= 3) {
        const localLib = argsv[2];
        if (!helpAlias.includes(localLib) && localLibs.includes(localLib)) {
            recognized = true;
            const localPath = path.join(__dirname, '..', 'node_modules/.bin', localLib)
            const commadnToRun = `${localPath} ${argsv.slice(3).join(' ')}`
            try {
                runCommand(commadnToRun).sync()
            } catch (error) {
                console.log(`Command ${localLib} ERROR...`);
            }
            process.exit(0)
        }
    }

    // await initWatcherDB();
    // process.stdin.resume();

    const helpFile = glob.sync(path.join(__dirname, '/scripts/HELP.js'))[0]
    const files = [helpFile]
        .concat(glob.sync(path.join(__dirname, '/scripts/*.js')).filter(f => f != helpFile))



    files.forEach(function (file) {
        let defaultObjectFunctionsOrHelpString = require(path.resolve(file)).default;
        if (_.isObject(defaultObjectFunctionsOrHelpString)) {
            _.forIn(defaultObjectFunctionsOrHelpString, (v: Function | [Function, string] | string, k) => {
                if (!isString(v)) {
                    const vFn: Function = (Array.isArray(v) && v.length >= 1 ? v[0] : v) as any;
                    if (_.isFunction(vFn)) {
                        const check = match(k, argsv);
                        if (check.isMatch) {
                            recognized = true;

                            vFn.apply(null, [check.restOfArgs.join(' ')]);
                            process.stdin.resume();
                        }
                    }
                }

            })
        }
    });
    if (!recognized) {
        if (Array.isArray(argsv) && argsv.length == 3) {
            console.log(`\n${chalk.red('Not recognized command')}: ${chalk.bold(argsv[2])}\n`)
        } else if (Array.isArray(argsv) && argsv.length >= 3) {
            console.log(`\n${chalk.red('Not recognized arguments:')} ${chalk.bold(argsv.slice(2).join(' '))}\n`)
        } else {
            console.log(`\n${chalk.cyan('Please use help:')} ${chalk.bold('tnp run help')}\n`)
        }
        process.exit(1);
    }

}






