
import * as fs from 'fs';
import * as _ from 'lodash';
import * as path from 'path';
import chalk from 'chalk';
import * as child from 'child_process'
import { kebabCase } from 'lodash';
import { PathParameter } from './path-parameter';

export function getNpmVersion(): string {
    return JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8').toString()).version
}


export function getStrategy(procesArgs: string[] = process.argv): { strategy: PathParameter, args: any[]; } {
    // console.log(JSON.stringify(procesArgs))
    let strategy: PathParameter = PathParameter.__NONE;
    let args = [];
    for (let enumMember in PathParameter) {
        let isValueProperty = parseInt(enumMember, 10) >= 0;
        const arg = kebabCase(PathParameter[enumMember].toString());
        const isWithoutDash = PathParameter[enumMember].toString().startsWith('$');
        // console.log('isWithoutDash', arg)
        const isOkArg = procesArgs.filter((a, i) => {
            const condition = (isWithoutDash && a === `${arg}`)
                || a === `--${arg}`
                || a === `-${arg.substr(0, 1)}`;
            if (condition) {
                args = _.slice(procesArgs, i + 1, procesArgs.length);
            }
            return condition;
        }).length > 0;

        if (isValueProperty && isOkArg) {
            return { strategy: parseInt(enumMember, 10), args };
        }
    }
    return { strategy: PathParameter.__NONE, args: procesArgs };
}

export function execute(scriptName: string, env?: Object) {
    return function () {
        const p = path.join(__dirname, '../scripts', scriptName);
        if (!fs.existsSync(p)) {
            console.log(chalk.red(`Undefined script "${p}"`));
            process.exit(1);
        }
        child.execSync(`bash ${p}`, {
            cwd: process.cwd(),
            stdio: [0, 1, 2],
            env
        })
    }

}

