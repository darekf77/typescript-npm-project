import * as _ from 'lodash';
import glob = require('glob')
import * as path from 'path';

export function run(argsv: string[]) {
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

function paramsFrom(command: string) {
    return _.kebabCase(command);
}

export function tnpCall(fn: Function, params: string) {
    return `tnp ${paramsFrom(fn.name)} ${params}`;
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

