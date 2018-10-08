//#region @backend
import * as child from 'child_process'
import chalk from 'chalk';
import * as _ from 'lodash';
import * as fs from 'fs';
import * as path from 'path';
import * as os from "os";
import * as sleep from 'sleep';


import { error, info, warn } from "./messages";
import { RunOptions, WatchOptions } from "./models";
import config from './config';
import { paramsFrom } from './index';
const prompts = require('prompts');
export async function questionYesNo(message: string,
  callbackTrue: () => any, callbackFalse?: () => any) {
  const response = await prompts({
    type: 'toggle',
    name: 'value',
    message,
    initial: true,
    active: 'yes',
    inactive: 'no'
  });
  if (response.value) {
    callbackTrue()
  } else {
    if (_.isFunction(callbackFalse)) {
      callbackFalse()
    }
  }
}


export function killProcess(byPid: number) {
  run(`kill -9 ${byPid}`).sync()
}

export function killProcessByPort(port: number) {
  try {
    run(`fkill -f :${port}`, { output: false }).sync()
    info(`Processs killed successfully on port: ${port}`)
  } catch (e) {
    warn(`Cannot kill process on port: ${port}... `)
  }


  // console.log(`Killing process on port ${port} in progress`);
  // try {
  //   if (os.platform() === 'linux') {
  //     run(`lsof -i:${port}`, { output: false }).sync()
  //   } else if (os.platform() === 'darwin') {
  //     run(`lsof -P | grep ':${port}' | awk '{print $2}' | xargs kill -9 `, { output: false }).sync()
  //   }
  //   info(`Process killed on port: ${port}`)
  // } catch (e) {
  //   error(`Problem with killing process on port ${port}:
  //   ${e}
  //   `, true)
  // }
}

export function clearConsole() {
  // try {
  //   if (process.platform === 'win32') {
  //     run('cls').sync()
  //   }
  //   run('clear').sync()
  // } catch (error) {
  //   console.log('clear console not succedd')
  // }

}






// const processes: child.ChildProcess[] = [];
// const cleanExit = function () {
//   processes.forEach(p => {
//     p.kill('SIGINT')
//     p.kill('SIGTERM')
//     console.log(`Killing child process on ${p.pid}`)
//   })
//   console.log(`Killing parent on ${process.pid}`)
//   process.exit()
// };
// process.on('SIGINT', cleanExit); // catch ctrl-c
// process.on('SIGTERM', cleanExit); // catch kill
// process.on('uncaughtException', cleanExit)
// process.on('unhandledRejection', cleanExit)


// process.once('unhandledRejection', (err, aa) => {
//   error(`'Exiting unhandledRejection

//     Reason: ${err}
//     ${JSON.stringify(aa)}
//   `);
// })


export function log(proc: child.ChildProcess, output = true) {
  // processes.push(proc);

  if (output) {
    proc.stdout.on('data', (data) => {
      console.log(data.toString());
    })

    proc.stderr.on('data', (data) => {
      console.log(data.toString());
    })
  }

  return proc;
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
  return os.platform() === 'win32' ? `"${cmd}"` : `'${cmd}'`
}

export const watcher = {
  run(command: string, folderPath: string = 'src', options: WatchOptions) {
    const { cwd = process.cwd(), wait } = options;
    let cmd = `tnp command ${command}`;
    const toRun = `watch ${prepareWatchCommand(cmd)} ${folderPath} ${wait ? ('--wait=' + wait) : ''}`;
    console.log('WATCH COMMAND ', toRun)
    return run(toRun, { cwd }).async()
  },

  call(fn: Function | string, params: string, folderPath: string = 'src', options: WatchOptions) {
    const { cwd = process.cwd(), wait } = options;
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
  // console.log(` for command: ${command} options`, options)
  if (!options) options = {};
  if (options.output === undefined) options.output = true;
  if (options.biggerBuffer === undefined) options.biggerBuffer = false;
  if (options.cwd === undefined) options.cwd = process.cwd()
  return {
    sync() {
      if (_.isNumber(options.tryAgainWhenFailAfter) && options.tryAgainWhenFailAfter > 0) {
        try {
          const proc = runSyncIn(command, options);
          return proc;
        } catch (error) {
          console.log(`Trying again command: ${command}`)
          sleep.msleep(options.tryAgainWhenFailAfter)
          return run(command, options).sync();
        }
      }
      return runSyncIn(command, options);
    },
    async() {
      return runAsyncIn(command, options);
    }
  }
}



//#endregion
