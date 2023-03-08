import { path, Helpers } from 'tnp-core';
import { fse, crossPlatformPath } from 'tnp-core'

declare const global: any;
if (global.globalSystemToolMode) {

  const frameworkName = global.frameworkName ? global.frameworkName : 'tnp';
  // console.log(`frameworkName: ${frameworkName}`)
  /*
  Explanation of this:
firedev
[firedev][tmp-environment] PATH EXISIT: /Users/dfilipiak/projects/npm/firedev/node_modules/tnp/tmp-environment.json
[firedev][tmp-environment] PATH NOT EXISIT: /Users/dfilipiak/projects/npm/firedev/node_modules/tmp-environment.json
[firedev][tmp-environment] PATH EXISIT: /Users/dfilipiak/projects/npm/firedev/tmp-environment.json
firedev
[firedev][tmp-environment] PATH EXISIT: /Users/dfilipiak/projects/npm/tnp/dist/tmp-environment.json
[firedev][tmp-environment] PATH EXISIT: /Users/dfilipiak/projects/npm/tnp/tmp-environment.json
[firedev][tmp-environment] PATH NOT EXISIT: /Users/dfilipiak/projects/npm/tmp-environment.json
   */
  const configFileName = 'tmp-environment.json';
  const possiblePathes = [
    path.join(crossPlatformPath(__dirname), configFileName),
    path.join(crossPlatformPath(__dirname), `../${configFileName}`),
    path.join(crossPlatformPath(__dirname), `../../${configFileName}`),
  ];
  possiblePathes.map(p => path.resolve(p))
    .filter(p => {
      return p.search(`${frameworkName}/${configFileName}`) !== -1;
    })
    .sort((a, b) => {
      // ASC  -> a.length - b.length
      // DESC -> b.length - a.length
      return a.length - b.length;
    });

  let newENV = {} as any;
  possiblePathes.find(envPath => {
    if (fse.existsSync(envPath)) {
      try {
        newENV = fse.readJSONSync(envPath);
        Helpers.log(`[firedev][tmp-environment] accepted path: ${envPath}`)
        return true;
      } catch (er) {
        Helpers.warn(`[firedev][tmp-environment] not able to read: ${envPath}`)
      }
      Helpers.info(`[firedev][tmp-environment] PATH EXISIT: ${envPath}`)
    } else {
      Helpers.warn(`[firedev][tmp-environment] PATH NOT EXISIT: ${envPath}`)
    }
    return false;
  });
  global['ENV'] = newENV;
}
if (Object.keys(global['ENV']).length === 0) {
  Helpers.warn(`[firedev][tmp-environment] ENVIRONMENT CONFIG IS NOT DEFINED/EMPTY`);
}

//#region imports
import { _ } from 'tnp-core';
import { config } from 'tnp-config';
import scriptsFnArr from './lib/scripts/index';

import axios from 'axios';
/**
 * ISSUE larget http request sometime are failing ... but with second try everying is OK
 */
axios.defaults.timeout = config.CONST.BACKEND_HTTP_REQUEST_TIMEOUT; // TODO QUICK_FIX

import { Project } from './lib/project';


// import { ConsoleUi } from './console-ui';
import { Helpers as TnpHelpers } from 'tnp-helpers';

import { CLASS } from 'typescript-class-helpers';
import { CLI } from 'tnp-cli';
//#endregion


//#region handle special args
const SPECIAL_ARGS = [
  '--copyto',
  '--copyTo'
];
export function handleSpecialArgs(argsv: string[]) {
  let tmpArgsv = _.cloneDeep(argsv);
  let startSarchFromIndex: number;
  do {
    if (_.isNumber(startSarchFromIndex) && startSarchFromIndex >= tmpArgsv.length) {
      break;
    }
    var rebuildStructure = false;
    let indexRebuild: number;
    tmpArgsv.find((a, i) => {
      if (_.isNumber(startSarchFromIndex) && i < startSarchFromIndex) {
        return false;
      }
      if (SPECIAL_ARGS.includes(a)) {
        rebuildStructure = true;
        indexRebuild = i;
        return true;
      }
      return false;
    });
    if (rebuildStructure) {
      let newArgs = tmpArgsv.slice(0, indexRebuild);
      const cmd = tmpArgsv[indexRebuild];
      const firstArgs = tmpArgsv[indexRebuild + 1];
      newArgs.push(cmd);
      newArgs.push(firstArgs);

      let endIndex: number;
      tmpArgsv.find((a, i) => {
        if ((i - 2) >= indexRebuild) {
          if (a.startsWith('-')) {
            endIndex = i;
            return true;
          }
          newArgs.push(cmd);
          newArgs.push(a);
        }
        return false;
      });
      const lenBefore = newArgs.length;
      if (_.isNumber(endIndex)) {
        newArgs = [
          ...newArgs,
          ...tmpArgsv.slice(endIndex),
        ];

      }
      startSarchFromIndex = lenBefore;
      tmpArgsv = newArgs;
    }

  } while (rebuildStructure);
  return tmpArgsv;
}
//#endregion

export async function start(
  argsv: string[],
  frameworkName: 'tnp' | 'firedev' = 'tnp',
  mode: 'dist' | 'bundle' | 'npm' = 'dist'
) {

  // // const proc = require('process');
  // global?.spinner?.start()

  Helpers.log(`ins start, mode: "${mode}"`);
  config.frameworkName = frameworkName;


  argsv = handleSpecialArgs(argsv);
  argsv = argsv.map((arg, i) => {
    const biggerRep = config.argsReplacements[arg];
    const minus = argsv[i - 1];
    if (biggerRep && minus && !minus.startsWith('-')) {
      return biggerRep;
    }
    return arg;
  });

  Helpers.log(`[start] accesing db..please wait`)

  Helpers.log(`[start] instance access granted`)
  // Helpers.log(argsv)

  //#region local libs run
  // if (Array.isArray(argsv) && argsv.length >= 3) {
  //   const localLib = argsv[2];
  //   if (localLib === "i") {
  //     argsv[2] = 'install'
  //   }
  //   if (localLib === "ui") {
  //     argsv[2] = 'uninstall'
  //   }
  // if (!config.helpAlias.includes(localLib) && config.localLibs.includes(localLib)) {
  //   recognized = true;
  //   const localPath = path.join(config.pathes.bin_in_node_modules, localLib)
  //   const commadnToRun = `${localPath} ${argsv.slice(3).join(' ')}`
  //   try {
  //     spinner && spinner?.stop()
  //     runCommand(commadnToRun).sync()
  //   } catch (error) {
  //     Helpers.log(`Command ${localLib} ERROR...`);
  //   }
  //   process.exit(0)
  // }
  // }

  // await initWatcherDB();
  // process.stdin.resume();

  // const helpFile = glob.sync(config.pathes.scripts.HELP_js)[0]
  // const files = [helpFile]
  //   .concat(glob.sync(config.pathes.scripts.allPattern).filter(f => f !== helpFile));

  // Helpers.log(files);
  //#endregion

  let recognized = false;
  const functionsToCHeck: Function[] = []
  const files = scriptsFnArr;

  Helpers.log('checking asdasd... please wait')
  for (let index = 0; index < files.length; index++) {
    let breakLoop = false;
    Helpers.log(`check function command`, 1);
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
              const check = TnpHelpers.cliTool.match(vFnName, argsv);
              if (check.isMatch) {
                recognized = true;
                // spinner && spinner?.stop()
                // Helpers.log('FNNAME',vFn.name)
                // process.exit(0)
                Helpers.log('--- recognized command ---' + CLASS.getName(vFn))
                global?.spinner?.stop();
                vFn.apply(null, [TnpHelpers.cliTool.globalArgumentsParserTnp(check.restOfArgs)]);
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
  // spinner && spinner?.stop()
  if (recognized) {
    // Helpers.log("RECOGNIZED !!")
    process.stdin.resume();
  } else {
    // Helpers.log("NOT RECOGNIZED !!")
    if (Array.isArray(argsv) && argsv.length == 3) {
      Helpers.error(`\n${CLI.chalk.red('Not recognized command')}: ${CLI.chalk.bold(argsv[2])}\n`, false, true);
    } else if (Array.isArray(argsv) && argsv.length >= 3) {
      Helpers.error(`\n${CLI.chalk.red('Not recognized arguments:')} ${CLI.chalk.bold(argsv.slice(2).join(' '))}\n`, false, true);
    } else {
      const p = void 0; //(Project.Current as Project);

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
        Helpers.error(`\n${CLI.chalk.cyan('Please use help:')} ${CLI.chalk.bold(`${config.frameworkName} run help`)}\n`, false, true);
      }
    }
  }


}


