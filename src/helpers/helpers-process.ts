//#region @backend
import * as child from 'child_process'
import * as _ from 'lodash';
import chalk from 'chalk';
import * as fs from 'fs';
import * as os from "os";
import * as path from 'path';
import * as sleep from 'sleep';
import * as fkill from 'fkill';
import * as dateformat from "dateformat";
import { error, info, warn, log } from "./helpers-messages";

import { RunOptions, WatchOptions } from "../models";

import { paramsFrom } from './helpers';
import { runSyncOrAsync } from './helpers';
const prompts = require('prompts');
export async function questionYesNo(message: string,
  callbackTrue?: () => any, callbackFalse?: () => any) {

  // const response: { value: boolean } = await inquirer
  //   .prompt([
  //     {
  //       type: 'confirm',
  //       name: 'value',
  //       message,
  //       // choices: this.parent.children
  //       //   .filter(c => config.allowedTypes.app.includes(c.type))
  //       //   .filter(c => c.name !== this.name)
  //       //   .map(c => c.name),
  //       // filter: function (val) {
  //       //   return val.toLowerCase();
  //       // }
  //     }
  //   ]) as any;

  // if (response.value) {
  //   callbackTrue()
  // } else {
  //   if (_.isFunction(callbackFalse)) {
  //     callbackFalse()
  //   }
  // }
  let response = {
    value: true
  };
  if (!global.tnpNonInteractive) {
    response = await prompts({
      type: 'toggle',
      name: 'value',
      message,
      initial: true,
      active: 'yes',
      inactive: 'no'
    });
  }
  if (response.value) {
    await runSyncOrAsync(callbackTrue);
  } else {
    await runSyncOrAsync(callbackFalse);
  }
  return response.value;
}

export function getWorkingDirOfProcess(PID: number) {
  try {
    const cwd = child.execSync(`lsof -p ${PID} | awk '$4=="cwd" {print $9}'`).toString().trim()
    return cwd;
  } catch (e) {
    error(e);
  }
}

export function patchingForAsync(absoluteFilePath: string,
  asynchronousCallback: (absoluteFilePath) => any, taskName: string = 'AsyncActionPath', limit = 2) {
  const key = `pathes${_.camelCase(taskName)}`;
  const idKey = 'asyncId';

  taskName = `${taskName}(limit = ${limit})`;

  if (_.isUndefined(patchingForAsync.prototype[idKey])) {
    patchingForAsync.prototype[idKey] = 0;
  } else {
    ++patchingForAsync.prototype[idKey];
  }
  const id = `id(${patchingForAsync.prototype[idKey]})`;

  if (_.isUndefined(patchingForAsync.prototype[key])) {
    patchingForAsync.prototype[key] = []
  }
  const pathes = patchingForAsync.prototype[key];

  if (pathes.filter(o => o === absoluteFilePath).length === 0) {
    if (limit > 0) {
      _.times(limit, () => {
        pathes.push(absoluteFilePath);
      });
    }

    // log(`[${taskName}][${path.basename(absoluteFilePath)}] EXECUTE START ${id}`);
    asynchronousCallback(absoluteFilePath);
    info(`[${taskName}][${path.basename(absoluteFilePath)}] EXECUTE DONE ${id}`);
  } else {
    const existed = pathes.find(ap => ap === absoluteFilePath);
    if (existed) {
      const indexExisted = pathes.indexOf(existed);
      patchingForAsync.prototype[key] = pathes.filter((v, i) => i !== indexExisted);
    }
    const left = pathes.filter(ap => ap === absoluteFilePath).length;
    // warn(`[${taskName}][${path.basename(absoluteFilePath)}] LEFT(${left}) ${id}`)
  }

}

export async function compilationWrapperTnp(fn: () => void, taskName: string = 'Task',
  executionType: 'Compilation' | 'Code execution' = 'Compilation') {
  function currentDate() {
    return `[${dateformat(new Date(), 'HH:MM:ss')}]`;
  }
  if (!fn || !_.isFunction(fn)) {
    error(`${executionType} wrapper: "${fs}" is not a function.`)
    process.exit(1)
  }

  try {
    log(`${currentDate()} ${executionType} of "${chalk.bold(taskName)}" starte...`)
    await runSyncOrAsync(fn)
    log(`${currentDate()} ${executionType} of "${chalk.bold(taskName)}" finish OK...`)
  } catch (error) {
    log(chalk.red(error));
    log(`${currentDate()} ${executionType} of ${taskName} ERROR`);
    process.exit(1);
  }

}

export function terminalLine() {
  return _.times(process.stdout.columns, () => '-').join('')
}

export function killProcess(byPid: number) {
  run(`kill -9 ${byPid}`).sync()
}

export async function killProcessByPort(port: number) {
  try {
    await fkill(`:${port}`);
    // run(`fkill -f :${port} &> /dev/null`, { output: false }).sync()
    info(`Processs killed successfully on port: ${port}`)
  } catch (e) {
    warn(`No process to kill  on port: ${port}... `)
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
  console.log('\x1Bc');

  // process.stdout.write('\033c\033[3J');
  // try {
  //   if (process.platform === 'win32') {
  //     run('cls').sync()
  //   }
  //   run('clear').sync()
  // } catch (error) {
  //   console.log('clear console not succedd')
  // }

}






const processes: child.ChildProcess[] = [];
const cleanExit = function () {
  processes.forEach(p => {
    p.kill('SIGINT')
    p.kill('SIGTERM')
    log(`Killing child process on ${p.pid}`)
  })
  log(`Killing parent on ${process.pid}`)
  process.exit()
};
process.on('SIGINT', cleanExit); // catch ctrl-c
process.on('SIGTERM', cleanExit); // catch kill
// process.on('uncaughtException', cleanExit)
// process.on('unhandledRejection', cleanExit)


// process.once('unhandledRejection', (err, aa) => {
//   error(`'Exiting unhandledRejection

//     Reason: ${err}
//     ${JSON.stringify(aa)}
//   `);
// })

function modifyLineByLine(data: string | Buffer | Error, outputLineReplace: (outputLine: string) => string) {
  let modifyOutput = _.isFunction(outputLineReplace);
  if (modifyOutput && _.isString(data)) {
    data = data.split(/\r?\n/).map(line => outputLineReplace(line)).join('\n');
  }
  return data as string;
}

export function logProc(proc: child.ChildProcess, output = true, stdio,
  outputLineReplace: (outputLine: string) => string) {
  processes.push(proc);

  proc.stdio = stdio;



  if (output) {
    proc.stdout.on('data', (data) => {
      process.stdout.write(modifyLineByLine(data, outputLineReplace))
    })

    proc.stdout.on('error', (data) => {
      console.log(modifyLineByLine(data, outputLineReplace));
    })

    proc.stderr.on('data', (data) => {
      process.stderr.write(modifyLineByLine(data, outputLineReplace))
    })

    proc.stderr.on('error', (data) => {
      console.log(modifyLineByLine(data, outputLineReplace));
    })

  }

  return proc;
}

function checkProcess(dirPath: string, command: string) {
  if (!fs.existsSync(dirPath)) error(`
  Path for process cwd doesn't exist: ${dirPath}
  command: ${command}
  `);
  if (!command) error(`Bad command: ${command}`);
}

const bigMaxBuffer = 2024 * 500;

function getStdio(options?: RunOptions) {
  const {
    output, silence,
    // pipeToParentProcerss = false,
    // inheritFromParentProcerss = false
  } = options;
  let stdio = output ? [0, 1, 2] : ((_.isBoolean(silence) && silence) ? 'ignore' : undefined);
  // if (pipeToParentProcerss) {
  //   stdio = ['pipe', 'pipe', 'pipe'] as any;
  // }
  // if (inheritFromParentProcerss) {
  //   stdio = ['inherit', 'inherit', 'inherit'] as any;
  // }
  return stdio;
}

function runSyncIn(command: string, options?: RunOptions) {
  const { cwd, biggerBuffer } = options;
  const maxBuffer = biggerBuffer ? bigMaxBuffer : undefined;
  let stdio = getStdio(options)
  checkProcess(cwd, command);
  return child.execSync(command, { stdio, cwd, maxBuffer })
}

function runAsyncIn(command: string, options?: RunOptions) {
  const { output, cwd, biggerBuffer, outputLineReplace } = options;
  const maxBuffer = biggerBuffer ? bigMaxBuffer : undefined;
  let stdio = getStdio(options)
  checkProcess(cwd, command);
  return logProc(child.exec(command, { cwd, maxBuffer }), output, stdio, outputLineReplace);
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
    const { cwd = process.cwd() } = options;
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
  // console.log(`Command: "${command}" , options "${_.isObject(options) ? JSON.stringify(options) : options}"`)
  if (!options) options = {};
  if (options.output === undefined) options.output = true;
  if (options.biggerBuffer === undefined) options.biggerBuffer = false;
  if (options.cwd === undefined) options.cwd = process.cwd()
  return {
    sync(): Buffer {
      if (_.isNumber(options.tryAgainWhenFailAfter) && options.tryAgainWhenFailAfter > 0) {
        try {
          const proc = runSyncIn(command, options);
          return proc;
        } catch (error) {
          console.log(`Trying again command: ${command}`)
          sleep.msleep(options.tryAgainWhenFailAfter)
          return run(command, options).sync()
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
