import * as _ from 'lodash';
import glob = require('glob')
import * as path from 'path';
import { run as runCommand } from "./process";
export { config } from './config';
export * from './helpers'
import { Helpers } from "morphi";

Helpers.checkEnvironment({
    npm: [
        { name: 'watch', version: '1.0.2' }
    ],
    programs: [
        {
            name: 'code',
            website: 'https://code.visualstudio.com/'
        }
})

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
    'sloc'
]

export function run(argsv: string[]) {

    if (Array.isArray(argsv) && argsv.length >= 3) {
        const localLib = argsv[2];
        if (localLibs.includes(localLib)) {
            const localPath = path.join(__dirname, '..', 'node_modules/.bin', localLib)
            const commadnToRun = `${localPath} ${argsv.slice(3).join(' ')}`
            runCommand(commadnToRun).sync()
            process.exit(0)
        }
    }

    glob.sync(
        path
            .join(__dirname, '/scripts/*.js'))
        .forEach(function (file) {
            let arr = require(path.resolve(file)).default;
            if (_.isObject(arr)) {
                _.forIn(arr, (v: Function, k) => {
                    if (typeof v === 'function') {
                        const check = match(k, argsv);
                        if (check.isMatch) {
                            v.apply(null, [check.restOfArgs.join(' ')]);
                            process.stdin.resume();
                        }
                    }
                })
            }
        });
}

export function paramsFrom(command: string) {
    return _.kebabCase(command);
}


function match(name: string, argv: string[]): { isMatch: boolean; restOfArgs: string[] } {
    let isMatch = false;
    let restOfArgs = argv;

    isMatch = argv.filter((vv, i) => {
        const nameInKC = paramsFrom(name);
        const isWithoutDash = name.startsWith('$');
        const argInKC = paramsFrom(vv);

        const condition =
            (isWithoutDash && argInKC === `${nameInKC}`)
            || argInKC === `${nameInKC}`
            || argInKC === `${nameInKC.substr(0, 1)}`;
        if (condition) {
            restOfArgs = _.slice(argv, i + 1, argv.length);
        }
        return condition;
    }).length > 0;
    return { isMatch, restOfArgs };
}

