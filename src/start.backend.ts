//#region @backend
import * as _ from 'lodash';
import * as fse from 'fs-extra';
import { config } from './config';
// import glob = require('glob')
import scriptsFnArr from './scripts/index';

import * as path from 'path';
import { Helpers } from 'tnp-helpers';
import chalk from 'chalk';
import { Project } from './project';
// import { Ora } from 'ora';


// import { ConsoleUi } from './console-ui';
import { $LAST } from './scripts/DB';
import { TnpDB } from 'tnp-db';
import { Models } from 'tnp-models';
import { IncCompiler } from 'incremental-compiler';
import { CLASS } from 'typescript-class-helpers';

IncCompiler.init(async (asyncEvents) => {

}, {
  error: Helpers.error,
  log: Helpers.log,
  info: Helpers.info,
  warn: Helpers.warn
} as any);



function removeArg(arg: string, argsv: string[]) {
  argsv = argsv.filter((f, i) => {
    const regexString = `^\\-\\-(${arg}$|${arg}\\=)+`;
    // Helpers.log(regexString)
    if ((new RegExp(regexString)).test(f)) {
      // Helpers.log(`true: ${f}`)
      const nextParam = argsv[i + 1];
      if (nextParam && !nextParam.startsWith(`--`)) {
        argsv[i + 1] = '';
      }
      return false;
    } else {
      // Helpers.log(`false: ${f}`)
    }
    return true;
  }).filter(f => !!f);
  return argsv;
}


export function globalArgumentsParser(argsv: string[]) {

  let options = require('minimist')(argsv);
  const toCheck = {
    'findNearestProject': void 0,
    'findNearestProjectWithGitRoot': void 0,
    'findNearestProjectType': void 0,
    'findNearestProjectTypeWithGitRoot': void 0,
    'cwd': void 0
  };
  Object.keys(toCheck).forEach(key => {
    toCheck[key] = options[key];
  });
  options = _.cloneDeep(toCheck);
  let {
    findNearestProject,
    findNearestProjectWithGitRoot,
    findNearestProjectType,
    findNearestProjectTypeWithGitRoot,
    cwd
  } = options;

  Object
    .keys(options)
    .filter(key => key.startsWith('tnp'))
    .forEach(key => {
      options[key] = !!options[key];
      global[key] = options[key];
    });

  if (global.tnpNoColorsMode) {
    chalk.level = 0;
  }

  let cwdFromArgs = cwd;
  const findProjectWithGitRoot = !!findNearestProjectWithGitRoot ||
    !!findNearestProjectTypeWithGitRoot;

  if (_.isBoolean(findNearestProjectType)) {
    Helpers.error(`argument --findNearestProjectType needs to be library type:\n ${
      Models.libs.LibTypeArr.join(', ')}`, false, true);
  }
  if (_.isBoolean(findNearestProjectTypeWithGitRoot)) {
    Helpers.error(`argument --findNearestProjectTypeWithGitRoot needs to be library type:\n ${
      Models.libs.LibTypeArr.join(', ')}`, false, true);
  }

  if (!!findNearestProjectWithGitRoot) {
    findNearestProject = findNearestProjectWithGitRoot;
  }
  if (_.isString(findNearestProjectTypeWithGitRoot)) {
    findNearestProjectType = findNearestProjectTypeWithGitRoot;
  }

  if (_.isString(cwdFromArgs)) {
    if (findNearestProject || _.isString(findNearestProjectType)) {
      // Helpers.log('look for nearest')
      var nearest = Project.nearestTo(cwdFromArgs, {
        type: findNearestProjectType,
        findGitRoot: findProjectWithGitRoot,
      });
      if (!nearest) {
        Helpers.error(`Not able to find neerest project for arguments: [\n ${argsv.join(',\n')}\n]`, false, true)
      }
    }
    if (nearest) {
      cwdFromArgs = nearest.location;
    }
    if (fse.existsSync(cwdFromArgs) && !fse.lstatSync(cwdFromArgs).isDirectory()) {
      cwdFromArgs = path.dirname(cwdFromArgs);
    }
    if (fse.existsSync(cwdFromArgs) && fse.lstatSync(cwdFromArgs).isDirectory()) {
      process.chdir(cwdFromArgs);
    } else {
      Helpers.error(`Incorrect --cwd argument for args: [\n ${argsv.join(',\n')}\n]`, false, true)
    }

  }
  argsv = removeArg('findNearestProjectType', argsv);

  // process.exit(0)
  Object.keys(toCheck).forEach(argName => {
    argsv = removeArg(argName, argsv);
  });

  // Object
  //   .keys(global)
  //   .filter(key => key.startsWith('tnp'))
  //   .forEach(key => {
  //     Helpers.log(`globa.${key} = ${global[key]}`)
  //   })
  // Helpers.log('after remove', argsv)
  // process.exit(0)
  return argsv.join(' ');
}




export async function start(argsv: string[], frameworkName: 'tnp' | 'firedev' = 'tnp') {
  config.frameworkName = frameworkName;

  global.hideLog = false;

  argsv = argsv.map(arg => {
    if (arg === 'baw') {
      return 'build:app:watch';
    }
    if (arg === 'bdw') {
      return 'build:dist:watch';
    }
    if (arg === 'bdwa') {
      return 'build:dist:watch:all';
    }
    if (arg === 'blw') {
      return 'build:lib:watch';
    }
    if (arg === 'bbw') {
      return 'build:bundle:watch';
    }
    if (arg === 'bd') {
      return 'build:dist';
    }
    if (arg === 'bda') {
      return 'build:dist:all';
    }
    if (arg === 'bb') {
      return 'build:bundle';
    }
    if (arg === 'bbp') {
      return 'build:bundle:prod';
    }
    if (arg === 'bbpw') {
      return 'build:bundle:prod:watch';
    }
    if (arg === 'sb') {
      return 'static:build';
    }
    if (arg === 'sbl') {
      return 'static:build:lib';
    }
    if (arg === 'sba') {
      return 'static:build:app';
    }
    if (arg === 'ba') {
      return 'build:app';
    }
    if (arg === 'bap') {
      return 'build:app:prod';
    }
    if (arg === 'rp') {
      return 'releaseprod';
    }
    if (arg === 'r') {
      return 'releaseprod';
    }
    if (arg === 'ghpush') {
      return 'githubpush';
    }
    if (arg === 'ghpull') {
      return 'githubpull';
    }
    return arg;
  });
  // Helpers.log(argsv)
  // process.exit(0)
  Helpers.log(`[start] accesing db..please wait`)
  const db = await TnpDB.Instance;
  Helpers.log(`[start] instance access granted`)
  // Helpers.log(argsv)
  if (
    (argsv.length === 2 && argsv[1].endsWith('/bin/tnp')) ||
    (argsv.length === 3 && argsv[1].endsWith('/bin/tnp')
      && argsv[2] === _.kebabCase(_.lowerCase(CLASS.getName($LAST)))
    )
  ) {
    // info(`DO NOTHIGN`);
  } else {
    Helpers.info('SET COMMAND ')
    await db.transaction.setCommand(argsv.join(' '));
  }

  // await db.transaction.updateCurrentProcess()

  let recognized = false;
  if (Array.isArray(argsv) && argsv.length >= 3) {
    const localLib = argsv[2];
    if (localLib === "i") {
      argsv[2] = 'install'
    }
    if (localLib === "ui") {
      argsv[2] = 'uninstall'
    }
    // if (!config.helpAlias.includes(localLib) && config.localLibs.includes(localLib)) {
    //   recognized = true;
    //   const localPath = path.join(config.pathes.bin_in_node_modules, localLib)
    //   const commadnToRun = `${localPath} ${argsv.slice(3).join(' ')}`
    //   try {
    //     spinner && spinner.stop()
    //     runCommand(commadnToRun).sync()
    //   } catch (error) {
    //     Helpers.log(`Command ${localLib} ERROR...`);
    //   }
    //   process.exit(0)
    // }
  }

  // await initWatcherDB();
  // process.stdin.resume();

  // const helpFile = glob.sync(config.pathes.scripts.HELP_js)[0]
  // const files = [helpFile]
  //   .concat(glob.sync(config.pathes.scripts.allPattern).filter(f => f !== helpFile));

  // Helpers.log(files);

  const functionsToCHeck: Function[] = []

  const files = scriptsFnArr;

  Helpers.log('checking commands... please wait')
  for (let index = 0; index < files.length; index++) {
    let breakLoop = false;
    // Helpers.log(`check function command ${index}`);
    const file = files[index];
    const defaultObjectFunctionsOrHelpString = file; //require(path.resolve(file)).default;
    if (_.isObject(defaultObjectFunctionsOrHelpString)) {

      Object.keys(defaultObjectFunctionsOrHelpString).map(key => {
        const keyNoUnderscore = key.replace(/(\_|\$)/g, '')
        if (!defaultObjectFunctionsOrHelpString[keyNoUnderscore]) {
          defaultObjectFunctionsOrHelpString[keyNoUnderscore] = defaultObjectFunctionsOrHelpString[key]
        }
      })

      for (const objectKey in defaultObjectFunctionsOrHelpString) {
        if (defaultObjectFunctionsOrHelpString.hasOwnProperty(objectKey)) {
          const v = defaultObjectFunctionsOrHelpString[objectKey];
          if (recognized) {
            breakLoop = true;
            break;
          }
          if (!_.isString(v)) {
            const vFn: Function = (Array.isArray(v) && v.length >= 1 ? v[0] : v) as any;
            const vFnName = CLASS.getName(vFn);
            functionsToCHeck.push(vFn)
            if (_.isFunction(vFn)) {
              const check = Helpers.cliTool.match(vFnName, argsv);
              if (check.isMatch) {
                recognized = true;
                // spinner && spinner.stop()
                // Helpers.log('FNNAME',vFn.name)
                // process.exit(0)
                Helpers.log('--- recognized command ---' + CLASS.getName(vFn))
                vFn.apply(null, [globalArgumentsParser(check.restOfArgs)]);
                breakLoop = true;
                break;
              }
            }
          }
        }
      }
    }
    if (breakLoop) {
      break;
    }
  }
  // Helpers.log(' loop eneded ')
  // spinner && spinner.stop()
  if (recognized) {
    // Helpers.log("RECOGNIZED !!")
    process.stdin.resume();
  } else {
    // Helpers.log("NOT RECOGNIZED !!")
    if (Array.isArray(argsv) && argsv.length == 3) {
      Helpers.log(`\n${chalk.red('Not recognized command')}: ${chalk.bold(argsv[2])}\n`)
      process.exit(1);
    } else if (Array.isArray(argsv) && argsv.length >= 3) {
      Helpers.log(`\n${chalk.red('Not recognized arguments:')} ${chalk.bold(argsv.slice(2).join(' '))}\n`)
      process.exit(1);
    } else {
      const p = void 0; //Project.Current;

      if (p) {
        // TODO console ui
        // const ui = new ConsoleUi(p, db);
        // try {
        //   await ui.init(functions)
        // } catch (e) {
        //   // Helpers.log(e)
        //   process.exit(1)
        // }
      } else {
        Helpers.log(`\n${chalk.cyan('Please use help:')} ${chalk.bold('tnp run help')}\n`)
        process.exit(1);
      }
    }
  }


}






//#endregion
