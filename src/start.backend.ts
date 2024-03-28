//#region imports
import { path, Helpers, chokidar } from 'tnp-core/src';
import { fse, crossPlatformPath } from 'tnp-core/src';
import { Project } from './lib/project/abstract/project';
import { _ } from 'tnp-core/src';
import { config } from 'tnp-config/src';
import cliClassArr from './lib/project/cli/index';
import axios from 'axios';
import { Helpers as TnpHelpers } from 'tnp-helpers/src';
import { CLASS } from 'typescript-class-helpers/src';
import type { CommandLineFeature } from 'tnp-helpers/src';
import { BACKEND_HTTP_REQUEST_TIMEOUT } from './lib/constants';

//#endregion


//#region config / args replacement firedev
const argsReplacements = {
  // SHORTCUTS
  'ba': 'build:app',
  'baw': 'build:app:watch',

  'bw': 'build:watch',
  's': 'start',
  'sw': 'start:watch',
  'ew': 'electron:watch',
  'r': 'release',
  'rmajor': 'release:major',
  'rminor': 'release:minor',
  'r:major': 'release:major',
  'r:minor': 'release:minor',
  // 'ra': 'release:all',
  'ar': 'auto:release',
  'ard': 'auto:release:docs',
  're': 'reinstall',
  '--version': 'version',
  '-v': 'version',
  // open
  'occ': 'open:core:container',
  'ocp': 'open:core:project',
  'o': 'open',
  // test
  'twd': 'test:watch:debug',
  'tdw': 'test:watch:debug',
  'tw': 'test:watch',
  'td': 'test:debug',
  't': 'test',
  // other
  'au': 'autoupdate',
  'up': 'update',
};
//#endregion


//#region constants
/**
 * ISSUE larget http request sometime are failing ... but with second try everying is OK
 */
axios.defaults.timeout = BACKEND_HTTP_REQUEST_TIMEOUT; // TODO QUICK_FIX
//#endregion

//#region resolve env config
declare const global: any;
if (global.globalSystemToolMode) {

  const frameworkName = global.frameworkName ? global.frameworkName : 'tnp';
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
        Helpers.log(`[firedev][tmp-environment] not able to read: ${envPath}`)
      }
      Helpers.log(`[firedev][tmp-environment] PATH EXISIT: ${envPath}`)
    } else {
      Helpers.log(`[firedev][tmp-environment] PATH NOT EXISIT: ${envPath}`)
    }
    return false;
  });
  global['ENV'] = newENV;
}
if (Object.keys(global['ENV']).length === 0) {
  Helpers.warn(`[firedev][tmp-environment] ENVIRONMENT CONFIG IS NOT DEFINED/EMPTY`);
}
//#endregion

export async function start(
  argsv: string[],
  frameworkName: 'tnp' | 'firedev' = 'tnp',
  mode: 'dist' | 'npm' = 'dist'
) {

  Helpers.log(`ins start, mode: "${mode}"`);
  config.frameworkName = frameworkName;

  const commandArgIndex = 0;
  const commandArg = argsv[commandArgIndex];
  if (commandArg && !commandArg.startsWith('-')) {
    const longerCommandVersion = argsReplacements[commandArg];
    if (longerCommandVersion) {
      argsv[commandArgIndex] = longerCommandVersion;
    }

  }

  let recognized = false;

  const files = cliClassArr;

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
            if (_.isFunction(vFn)) {
              const classMethodsNames = CLASS.getMethodsNames(vFn).filter(f => !f.startsWith('_'));
              // if (vFnName === '') {
              //   console.log({ classMethodsNames, vFn })
              // }

              const check = TnpHelpers.cliTool.match({
                functionOrClassName: vFnName,
                restOfArgs: argsv,
                argsReplacements,
                classMethodsNames,
              });
              if (check.isMatch || (argsv.length === 0 && vFnName === '')) {
                recognized = true;
                Helpers.log('--- recognized command ---' + CLASS.getName(vFn))
                global?.spinner?.stop();
                const obj: CommandLineFeature = new (vFn as any)(
                  TnpHelpers.cliTool.globalArgumentsParserTnp(check.restOfArgs),
                  check.methodNameToCall,
                  Project.ins.nearestTo(process.cwd()),
                  process.cwd(),
                );
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
  if (recognized) {
    process.stdin.resume();
  } else {
    Helpers.error('Command not recognized', false, true);
  }

}

export default start;
