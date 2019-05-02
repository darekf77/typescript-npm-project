//#region @backend
import * as _ from 'lodash';
import glob = require('glob')
import * as path from 'path';
import { run as runCommand, match } from "./helpers";
import { isString } from 'util';
import chalk from 'chalk';
import { Project } from './project';
import { Ora } from 'ora';

import config from './config';
import { ConsoleUi } from './console-ui';
import { $LAST } from './scripts/DB';
import { TnpDB } from './tnp-db/wrapper-db';

export async function start(argsv: string[], spinner?: Ora) {
  const db = await TnpDB.Instance;
  // console.log(argsv)
  if (
    (argsv.length === 2 && argsv[1].endsWith('/bin/tnp')) ||
    (argsv.length === 3 && argsv[1].endsWith('/bin/tnp')
      && argsv[2] === _.kebabCase(_.lowerCase($LAST.name))
    )
  ) {
    // info(`DO NOTHIGN`);
  } else {
    await db.transaction.setCommand(argsv.join(' '));
  }

  // await db.transaction.updateCurrentProcess()

  let recognized = false;
  if (Array.isArray(argsv) && argsv.length >= 3) {
    const localLib = argsv[2];
    if (localLib === "i") {
      argsv[2] = 'install'
    }
    // if (!config.helpAlias.includes(localLib) && config.localLibs.includes(localLib)) {
    //   recognized = true;
    //   const localPath = path.join(config.pathes.bin_in_node_modules, localLib)
    //   const commadnToRun = `${localPath} ${argsv.slice(3).join(' ')}`
    //   try {
    //     spinner && spinner.stop()
    //     runCommand(commadnToRun).sync()
    //   } catch (error) {
    //     console.log(`Command ${localLib} ERROR...`);
    //   }
    //   process.exit(0)
    // }
  }

  // await initWatcherDB();
  // process.stdin.resume();

  const helpFile = glob.sync(config.pathes.scripts.HELP_js)[0]
  const files = [helpFile]
    .concat(glob.sync(config.pathes.scripts.allPattern).filter(f => f !== helpFile));


  const functions: Function[] = []

  files.some((file) => {
    let defaultObjectFunctionsOrHelpString = require(path.resolve(file)).default;
    if (_.isObject(defaultObjectFunctionsOrHelpString)) {

      Object.keys(defaultObjectFunctionsOrHelpString).map(key => {
        const keyNoUnderscore = key.replace(/(\_|\$)/g, '')
        if (!defaultObjectFunctionsOrHelpString[keyNoUnderscore]) {
          defaultObjectFunctionsOrHelpString[keyNoUnderscore] = defaultObjectFunctionsOrHelpString[key]
        }
      })

      for (const k in defaultObjectFunctionsOrHelpString) {
        if (defaultObjectFunctionsOrHelpString.hasOwnProperty(k)) {
          const v = defaultObjectFunctionsOrHelpString[k];
          if (recognized) {
            return true;
          }
          if (!isString(v)) {
            const vFn: Function = (Array.isArray(v) && v.length >= 1 ? v[0] : v) as any;
            functions.push(vFn)
            if (_.isFunction(vFn)) {
              const check = match(k, argsv);
              if (check.isMatch) {
                recognized = true;
                spinner && spinner.stop()
                vFn.apply(null, [check.restOfArgs.join(' ')]);
                return true;
              }
            }
          }
        }
      }
    }
    return false;
  });
  spinner && spinner.stop()
  if (recognized) {
    // console.log("RECOGNIZED !!")
    process.stdin.resume();
  } else {
    // console.log("NOT RECOGNIZED !!")
    if (Array.isArray(argsv) && argsv.length == 3) {
      console.log(`\n${chalk.red('Not recognized command')}: ${chalk.bold(argsv[2])}\n`)
      process.exit(0);
    } else if (Array.isArray(argsv) && argsv.length >= 3) {
      console.log(`\n${chalk.red('Not recognized arguments:')} ${chalk.bold(argsv.slice(2).join(' '))}\n`)
      process.exit(0);
    } else {
      const p = Project.Current;

      if (p) {

        const ui = new ConsoleUi(p, db);
        try {
          await ui.init(functions)
        } catch (e) {
          // console.log(e)
          process.exit(0)
        }
      } else {
        console.log(`\n${chalk.cyan('Please use help:')} ${chalk.bold('tnp run help')}\n`)
        process.exit(0);
      }
    }
  }


}






//#endregion
