//#region @backend
import chalk from 'chalk';
//#endregion
import { Morphi } from 'morphi';
import config from '../config';

//#region @backend
declare global {
  namespace NodeJS {
    interface Global {
      muteMessages: boolean;
    }
  }
}
//#endregion

export function error(details: any, noExit = false, noTrace = false) {
  if (Morphi.IsBrowser) {
    console.error(details)
  }
  //#region @backend
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
  //#endregion
}

export function info(details: string) {
  if (Morphi.IsBrowser) {
    console.info(details)
  }
  //#region @backend
  (!global.muteMessages && !global.hideInfos) && console.log(chalk.green(details))
  //#endregion
}

export function log(details: string) {
  if (Morphi.IsBrowser) {
    console.log(details)
  }
  //#region @backend
  // console.log('global.muteMessages', global.muteMessages);
  // console.log('global.hideLog', global.hideLog);
  (!global.muteMessages && !global.hideLog) && console.log(chalk.gray(details))
  //#endregion
}

export function warn(details: string, trace = false) {
  if (Morphi.IsBrowser) {
    console.warn(details)
  }
  //#region @backend
  if (trace) {
    (!global.muteMessages && !global.hideWarnings) && console.trace(chalk.yellow(details))
  } else {
    (!global.muteMessages && !global.hideWarnings) && console.log(chalk.yellow(details))
  }
  //#endregion
}

