import * as _ from 'lodash';
import glob = require('glob')
import * as path from 'path';

export function run(argsv) {
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
                            v.apply(null, check.restOfArgs);
                            process.exit(0)
                        }
                    }
                })
            }
        });
}


function match(name: string, argv: string[]): { isMatch: boolean; restOfArgs: string[] } {
    let isMatch = false;
    let restOfArgs = argv;

    isMatch = argv.filter((vv, i) => {
        const nameKebabCase = _.kebabCase(name);
        const isWithoutDash = name.startsWith('$');
        const argKebabCase = _.kebabCase(vv);

        const condition =
            (isWithoutDash && argKebabCase === `${nameKebabCase}`)
            || argKebabCase === `${nameKebabCase}`
            || argKebabCase === `${nameKebabCase.substr(0, 1)}`;
        if (condition) {
            restOfArgs = _.slice(argv, i + 1, argv.length);
        }
        return condition;
    }).length > 0;
    return { isMatch, restOfArgs };
}

