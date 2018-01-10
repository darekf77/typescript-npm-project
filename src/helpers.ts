
import * as fs from 'fs';
import * as _ from 'lodash';
import * as path from 'path';
import chalk from 'chalk';
import * as child from 'child_process'
import * as glob from 'glob';
import * as Filehound from 'filehound';

import { kebabCase } from 'lodash';
import { PathParameter } from './path-parameter';
import { LibType, PackageJSON } from './models';
import { config } from 'config';

export function error(details: string) {
    console.log(chalk.red(details));
    process.exit(1);
}

export function log(process: child.ChildProcess, output = true) {
    process.stdout.on('data', (data) => {
        console.log(data.toString());
    })
    process.stderr.on('data', (data) => {
        console.log(data.toString());
    })
}

function runSyncIn(dirPath: string, command: string, output = true) {
    if (output) return child.execSync('cd ' + dirPath + ` && ${command}`, { stdio: [0, 1, 2] })
    return child.execSync('cd ' + dirPath + ` && ${command}`)
}

function runAsyncIn(dirPath: string, command: string, output = true, biggerBuffer = false) {
    if (biggerBuffer) {
        log(child.exec('cd ' + dirPath + ` && ${command}`, { maxBuffer: 2024 * 500, cwd: dirPath }), output);
    } else {
        log(child.exec('cd ' + dirPath + ` && ${command}`, { cwd: dirPath }), output);
    }
}

export function run(command: string, output = true) {
    return {
        sync: {
            inProject(projectDirPath: string = process.cwd()) {
                return runSyncIn(projectDirPath, command, output);
            }

        },
        async: {
            inProject(projectDirPath: string = process.cwd(), biggerBuffer = false) {
                return runAsyncIn(projectDirPath, command, output, biggerBuffer);
            }
        }
    }
}


function getPackageJSON(dirPath: string): PackageJSON {
    const filePath = path.join(dirPath, 'package.json');
    try {
        const file = fs.readFileSync(filePath, 'utf8').toString();
        const json = JSON.parse(file);
        return json;
    } catch (err) {
        console.log(chalk.red(filePath));
        error(err)
    }
}

const packageJSON = {
    current: () => getPackageJSON(process.cwd()),
    tnp: () => getPackageJSON(path.join(__dirname, '..'))
}


export function preventNonInstalledNodeModules() {

    const clientNodeModules = path.join(process.cwd(), 'node_modules');
    if (!fs.existsSync(clientNodeModules)) {
        error("Please run `npm i` in your project");
    }
    const devDependencies = project.tnp.devDependencies()
    _.forIn(project.tnp.devDependencies(), (v, k) => {
        const version = (v as any).replace(/\~/g, '').replace(/\^/g, '')
        if (!fs.existsSync(path.join(process.cwd(), 'node_modules', k))) {
            console.log(`Installing ${k}@${version}`);
            child.execSync(`cd ${process.cwd()} && npm i ${k}@${version} --save-dev`, { cwd: process.cwd() })
        }
    })
}

function getProjectType(dirPath: string): LibType {
    const p = getPackageJSON(dirPath).tnp;
    if (!p) {
        error('Unrecognized project type');
        process.exit(1);
    }
    return p.type;
}

export const project = {
    current: {
        version: () => packageJSON.current().version,
        getType(): LibType {
            const p = packageJSON.current().tnp;
            if (!p) {
                error('Unrecognized project type');
                process.exit(1);
            }
            return p.type;
        },
        resources: (): string[] => {
            const p = packageJSON.current().tnp;
            if (!p) {
                error('Unrecognized project type');
                process.exit(1);
            }
            return Array.isArray(p.resources) ? p.resources : [];
        }
    },
    tnp: {
        version: () => packageJSON.tnp().version,
        devDependencies: () => packageJSON.tnp().devDependencies ?
            packageJSON.tnp().devDependencies : {}
    }

}

export function copyResourcesToBundle() {
    ['package.json'].concat(project.current.resources()).forEach(res => {
        const file = path.join(process.cwd(), res);
        const dest = path.join(process.cwd(), 'bundle', res);
        if(!fs.existsSync(file)) {
            error(`Resource file ${file} does not exist in ${process.cwd()}`)
        }
        fs.writeFileSync(dest, fs.readFileSync(file));
    })
    console.log(chalk.green('Resouces copied to npm bundle'))
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
            // console.log(a)
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


export function getProjectsInFolder(folderPath: string): { path: string; type: LibType; }[] {

    const subdirectories: string[] = Filehound.create()
        .path(folderPath)
        .directory()
        .findSync()

    const result = subdirectories.map(dir => {
        let type = getProjectType(dir);
        return { path: dir, type };
    })
    return result;
}
