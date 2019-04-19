//#region @backend
import chalk from 'chalk';
import config from './config';

declare global {
  namespace NodeJS {
    interface Global {
      muteMessages: boolean;
    }
  }
}


export function error(details: any, noExit = false, noTrace = false) {
  // Error.stackTraceLimit = Infinity;
  if (typeof details === 'object') {
    try {
      const json = JSON.stringify(details)
      if (noTrace) {
        !global.muteMessages && console.log(chalk.red(json));
      } else {
        !global.muteMessages && console.trace(chalk.red(json));
      }

    } catch (error) {
      if (noTrace) {
        !global.muteMessages && console.log(details);
      } else {
        !global.muteMessages && console.trace(details);
      }
    }
  } else {
    if (noTrace) {
      !global.muteMessages && console.log(chalk.red(details));
    } else {
      !global.muteMessages && console.trace(chalk.red(details));
    }

  }
  if (global[config.message.tnp_normal_mode]) {
    if (!noExit) {
      process.exit(1);
    }
  }
}

export function info(details: string) {
  // console.log('global.muteMessages',global.muteMessages)
  !global.muteMessages && console.log(chalk.green(details))
}

export function warn(details: string, trace = false) {
  if (trace) {
    !global.muteMessages && console.trace(chalk.yellow(details))
  } else {
    !global.muteMessages && console.log(chalk.yellow(details))
  }
}
//#endregion
