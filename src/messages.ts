//#region @backend
import chalk from 'chalk';
export function error(details: any, noExit = false, noTrace = false) {
  // Error.stackTraceLimit = Infinity;
  if (typeof details === 'object') {
    try {
      const json = JSON.stringify(details)
      if (noTrace) {
        console.log(chalk.red(json));
      } else {
        console.trace(chalk.red(json));
      }

    } catch (error) {
      if (noTrace) {
        console.log(details);
      } else {
        console.trace(details);
      }
    }
  } else {
    if (noTrace) {
      console.log(chalk.red(details));
    } else {
      console.trace(chalk.red(details));
    }

  }

  if (!noExit) {
    process.exit(1);
  }
}

export function info(details: string) {
  console.log(chalk.green(details))
}

export function warn(details: string, trace = false) {
  if (trace) {
    console.trace(chalk.yellow(details))
  } else {
    console.log(chalk.yellow(details))
  }
}
//#endregion
