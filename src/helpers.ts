
import * as fs from 'fs';
import * as _ from 'lodash';
import * as path from 'path';
import chalk from 'chalk';
import * as child from 'child_process'


import { kebabCase } from 'lodash';
import { PathParameter } from './path-parameter';
import { LibType, PackageJSON } from './models';

export function error(details: string) {
    console.log(chalk.red(details));
}

export function run(command: string) {
    return child.execSync('cd ' + process.cwd() + ` && ${command}`, { stdio: [0, 1, 2] })
}

function getPackageJSON(filePath: string): PackageJSON {
    try {
        const file = fs.readFileSync(filePath, 'utf8').toString();
        const json = JSON.parse(file);
        return json;
    } catch (error) {
        console.log(chalk.red(error));
        process.exit(1);
    }
}

const packageJSON = {
    current: () => getPackageJSON(path.join(process.cwd(), 'package.json')),
    tnp: () => getPackageJSON(path.join(__dirname, '../package.json'))
}

export const project = {
    current: {
        version: packageJSON.current().version,
        getType(): LibType {
            const p = packageJSON.current().tnp;
            if (!p) {
                error('Unrecognized project type');
                process.exit(1);
            }
            return p.type;
        }
    }

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



