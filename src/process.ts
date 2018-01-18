
import * as child from 'child_process'
import chalk from 'chalk';
import * as _ from 'lodash';
import * as fs from 'fs';
import * as path from 'path';

import { error, info } from "./messages";
import { paramFromFn } from "./index";
import { RunOptions } from "./models";

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
    run(command: string, folderPath: string = 'src') {
        return run(`watch 'tnp command ${encodeURIComponent(command)}' ${folderPath}`).async()
    }
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


