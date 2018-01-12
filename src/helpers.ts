
import * as fs from 'fs';
import * as _ from 'lodash';
import * as path from 'path';
import chalk from 'chalk';
import * as child from 'child_process'
import * as glob from 'glob';
import * as Filehound from 'filehound';

import { LibType, PackageJSON, Project } from './models';
import config from './config';
import { error } from "./errors";


export function log(process: child.ChildProcess, output = true) {
    process.stdout.on('data', (data) => {
        console.log(data.toString());
    })
    process.stderr.on('data', (data) => {
        console.log(data.toString());
    })
}

//#region  run process
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
//#endregion

//#region prevent
export const prevent = {
    unexist: {
        clientTsInSrc() {
            const src = {
                client: path.join(process.cwd(), 'src', 'client.ts')
            }
            if (!fs.existsSync(src.client)) {
                console.log('Creating client.ts file in src...');
                fs.writeFileSync(src.client,
                    `// File empty for purpose
            export * from './index';
            `, 'utf8')
            }
        }
    },
    notInstalled: {
        nodeModules(projectDir = process.cwd()) {
            const clientNodeModules = path.join(projectDir, 'node_modules');
            const yarnLock = path.join(projectDir, 'yarn.lock');
            if (!fs.existsSync(clientNodeModules)) {
                if (fs.existsSync(yarnLock)) {
                    console.log(chalk.green('Installing npm packages... from yarn.lock '))
                    run('yarn install').sync.inProject()
                } else {
                    console.log(chalk.green('Installing npm packages... '))
                    run('npm i').sync.inProject()
                }
            }
        },
        tnpDevDependencies() {
            const devDependencies = projects.tnp().packageJSON.devDependencies;
            _.forIn(devDependencies, (v, k) => {
                const version = (v as any).replace(/\~/g, '').replace(/\^/g, '')
                if (!fs.existsSync(path.join(process.cwd(), 'node_modules', k))) {
                    console.log(`Installing ${k}@${version}`);
                    child.execSync(`cd ${process.cwd()} && npm i ${k}@${version} --save-dev`, { cwd: process.cwd() })
                }
            })
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
