
import * as fs from 'fs';
import * as _ from 'lodash';
import * as path from 'path';
import chalk from 'chalk';
import * as child from 'child_process'
import * as glob from 'glob';
import * as Filehound from 'filehound';
import * as watch from 'node-watch';
import * as chokidar from 'chokidar';


import { LibType, PackageJSON, Project } from './models';
import config from './config';
import { error } from "./errors";

export function paramFromFn(fn: Function) {
    return _.kebabCase(fn.name);
}

export function log(process: child.ChildProcess, output = true) {
    process.stdout.on('data', (data) => {
        console.log(data.toString());
    })

    process.stderr.on('data', (data) => {
        console.log(data.toString());
    })

    return process;
}

function checkProcess(dirPath: string, command: string) {
    if (!fs.existsSync(dirPath)) error(`Path doesn't exist: ${dirPath}`);
    if (!command) error(`Bad command: ${command}`);
}

//#region  run process
function runSyncIn(dirPath: string, command: string, output = true, biggerBuffer = false) {
    checkProcess(dirPath, command);
    try {
        if (output) return child.execSync('cd ' + dirPath + ` && ${command}`, { stdio: [0, 1, 2] })
        return child.execSync('cd ' + dirPath + ` && ${command}`)
    } catch (err) {
        error(err);
    }
}

function runAsyncIn(dirPath: string, command: string, output = true, biggerBuffer = false) {
    checkProcess(dirPath, command);
    if (biggerBuffer) {
        return log(child.exec(command, { cwd: dirPath, maxBuffer: 2024 * 500 }), output);
    } else {
        return log(child.exec(command, { cwd: dirPath }), output);
    }
}

export const watcher = {
    run(command: Function, folderPath: string = 'src') {
        return run(`watch 'tnp ${paramFromFn(command)}' ${path.join(process.cwd(), folderPath)}`).async()
    }
}

export interface RunOptions {
    output?: boolean;
    projectDirPath?: string;
    biggerBuffer?: boolean;
    folder?: string;
}

export function run(command: string,
    options?: RunOptions) {
    let { output, projectDirPath, biggerBuffer, folder } = _.merge({
        output: true,
        projectDirPath: process.cwd(),
        biggerBuffer: false
    }, options)
    if (folder) projectDirPath = path.join(projectDirPath, folder);
    return {
        sync() {
            return runSyncIn(projectDirPath, command, output);

        },
        async() {
            return runAsyncIn(projectDirPath, command, output, biggerBuffer);
        }
    }
}
//#endregion

//#region prevent
type InstalationType = '-g' | '--save' | '--save-dev';

function installDependencies(packages: Object, type: InstalationType = '--save-dev') {
    _.forIn(packages, (v, k) => {
        const version = (v as any).replace(/\~/g, '').replace(/\^/g, '')
        if (!fs.existsSync(path.join(process.cwd(), 'node_modules', k))) {
            console.log(`Installing ${k}@${version}`);
            child.execSync(`cd ${process.cwd()} && npm i ${k}@${version} ${type}`, { cwd: process.cwd() })
        }
    });
}


function sleep() {
    console.log('SLEEEPS')
    run(`sleep 5`);
    sleep()
}

export const prevent = {
    notInstalled: {
        nodeModules(projectDir = process.cwd()) {
            const clientNodeModules = path.join(projectDir, 'node_modules');
            const yarnLock = path.join(projectDir, 'yarn.lock');
            if (!fs.existsSync(clientNodeModules)) {
                if (fs.existsSync(yarnLock)) {
                    console.log(chalk.green('Installing npm packages... from yarn.lock '))
                    run('yarn install').sync()
                } else {
                    console.log(chalk.green('Installing npm packages... '))
                    run('npm i').sync()
                }
            }
        },
        dependencies: {
            global() {
                const dependencies = projects.tnp().packageJSON.tnp.dependencies;
                installDependencies(dependencies.global);
            },
            forAllLibs() {
                const dependencies = projects.tnp().packageJSON.tnp.dependencies;
                installDependencies(dependencies.forAllLibs);
            },
            forBuild(porjectType: LibType) {
                const dependencies = projects.tnp().packageJSON.tnp.dependencies;
                installDependencies(dependencies.lib[_.kebabCase(porjectType)]);
            }
        }


    }
}
//#endregion

export const projects = {
    inFolder(folderPath: string): Project[] {

        const subdirectories: string[] = Filehound.create()
            .path(folderPath)
            .directory()
            .findSync()

        const result = subdirectories.map(dir => {
            return new Project(dir);
        })
        return result;
    },
    current() {
        return new Project(process.cwd())
    },
    tnp() {
        return new Project(path.join(__dirname, '..'))
    }
}


//#region copy resource
export function copyResourcesToBundle() {
    const bundleFolder = path.join(process.cwd(), config.folder.bundle);
    if (!fs.existsSync(bundleFolder)) fs.mkdirSync(bundleFolder);
    ['package.json'].concat(projects.current().resources).forEach(res => {
        const file = path.join(process.cwd(), res);
        const dest = path.join(bundleFolder, res);
        if (!fs.existsSync(file)) {
            error(`Resource file ${file} does not exist in ${process.cwd()}`)
        }
        fs.writeFileSync(dest, fs.readFileSync(file));
    })
    console.log(chalk.green('Resouces copied to npm bundle'))
}
//#endregion

//#region execute script
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
//#endregion
