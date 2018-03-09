
import * as child from 'child_process'
import chalk from 'chalk';
import * as _ from 'lodash';
import * as fs from 'fs';
import * as path from 'path';
import * as os from "os";

import { error, info } from "./messages";
import { RunOptions } from "./models";
import config from './config';
import { paramsFrom } from './index';

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

function runSyncIn(command: string, options?: RunOptions) {
    const { output, cwd } = options;
    checkProcess(cwd, command);
    if (output) {
        return child.execSync(command, { stdio: [0, 1, 2], cwd })
    }
    return child.execSync(command, { cwd })
}

function runAsyncIn(command: string, options?: RunOptions) {
    const { output, cwd, biggerBuffer } = options;
    checkProcess(cwd, command);
    if (biggerBuffer) {
        return log(child.exec(command, { cwd, maxBuffer: 2024 * 500 }), output);
    }
    return log(child.exec(command, { cwd }), output);
}

function prepareWatchCommand(cmd) {
    return os.platform() === 'win32' ? `"${cmd}"` : `"'${cmd}'"`
}

export const watcher = {
    run(command: string, folderPath: string = 'src', cwd: string = process.cwd()) {
        let cmd = `tnp command ${command}`;
        const toRun = `tnp watch ${prepareWatchCommand(cmd)} ${folderPath}`;
        return run(toRun, { cwd }).async()
    },

    call(fn: Function | string, params: string, folderPath: string = 'src', cwd: string = process.cwd()) {
        if (!fn) {
            error(`Bad function: ${fn} for watcher on folder: ${folderPath}, with params: ${params}`)
        }
        const fnName = typeof fn === 'function' ? fn.name : fn;
        // console.log('Function name ', fnName)
        let cmd = `tnp ${paramsFrom(fnName)} ${params}`;
        const toRun = `watch ${prepareWatchCommand(cmd)} ${folderPath}`;
        return run(toRun, { cwd }).async()
    }
}



export function run(command: string,
    options?: RunOptions) {
    if (!options) options = {};
    if (options.output === undefined) options.output = true;
    if (options.biggerBuffer === undefined) options.biggerBuffer = false;
    if (options.cwd === undefined) options.cwd = process.cwd()
    return {
        sync() {
            return runSyncIn(command, options);
        },
        async() {
            return runAsyncIn(command, options);
        }
    }
}


