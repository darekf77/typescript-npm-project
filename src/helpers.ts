
import * as fs from 'fs';
import * as _ from 'lodash';
import * as path from 'path';
import chalk from 'chalk';
import * as child from 'child_process'
import * as glob from 'glob';
import * as Filehound from 'filehound';
import * as chokidar from 'chokidar';


import { LibType, PackageJSON,  InstalationType } from './models';
import config from './config';
import { error, info } from "./messages";
import { Project } from "./project";

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



export function getPackageJSON(location: string): PackageJSON {
    const isTnpProject = (location === path.join(__dirname, '..'));
    const filePath = path.join(location, 'package.json');
    try {
        const file = fs.readFileSync(filePath, 'utf8').toString();
        const json: PackageJSON = JSON.parse(file);
        if (!json.tnp && !isTnpProject) {
            error(`Unrecognized project type ${filePath}`);
            process.exit(1);
        }
        return json;
    } catch (err) {
        error(filePath, true);
        error(err)
    }
}



function checkAndInstal(packages: Object, type: InstalationType = '--save-dev', packageJSONlocation = process.cwd()) {

}


export const install = {
    packages(wherePath: string, packageName?: string, type: InstalationType = '--save-dev', exact = false) {
        const yarnLock = path.join(wherePath, 'yarn.lock');
        const clientNodeModules = path.join(wherePath, 'node_modules');
        if (!fs.existsSync(clientNodeModules)) {
            if (fs.existsSync(yarnLock)) {
                info('Installing npm packages... from yarn.lock ')
                run('yarn install').sync()
                if (packageName) run(`yarn add ${packageName} ${type}`, { projectDirPath: wherePath })
            } else {
                info('Installing npm packages... ');
                run('npm i').sync()
                if (packageName) run(`npm i ${packageName} ${type}`, { projectDirPath: wherePath })
            }
        }
    },

    from(location: string) {
        const packageJSON: PackageJSON = getPackageJSON(location);
        return {
            dep() {

            },
            devDep() {

            },
            peer() {

            },
            _global() {

            },
            _commonDevTo(projectPath: string) {
                _.forIn(packageJSON.tnp.dependencies.forAllLibs, (v, k) => {
                    const version = (v as any).replace(/\~/g, '').replace(/\^/g, '')
                    if (!fs.existsSync(path.join(projectPath, 'node_modules', k))) {
                        info(`Installing ${k}@${version}`);
                        install.packages(projectPath, `${k}@${version}`);
                    }
                });
            },
            _forLib(libType: LibType) {

            }
        }
    }
}

function sleep() {
    console.log('SLEEEPS')
    run(`sleep 5`);
    sleep()
}


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

export function copy(sousrce: string, destination: string) {
    if (!fs.existsSync(sousrce)) {
        error(`[${copy.name}] No able to find source of ${sousrce}`);
    }
    fs.writeFileSync(this.path, fs.readFileSync(sousrce), 'utf8')
}
