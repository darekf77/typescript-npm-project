//#region @backend
import chalk from 'chalk';
import * as  underscore from 'underscore';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as glob from 'glob';
import * as rimraf from "rimraf";
import { sleep } from 'sleep';
import { error, warn, log } from "./helpers-messages";
//#endregion

import * as _ from 'lodash';
import { config } from '../config';
import { Project, LibProject } from '../project';
import { LibType, LibTypeArr, RootArgsType } from '../models';

//#region @backend
function removeArg(arg: string, argsv: string[]) {
  argsv = argsv.filter((f, i) => {
    const regexString = `^\\-\\-(${arg}$|${arg}\\=)+`;
    // console.log(regexString)
    if ((new RegExp(regexString)).test(f)) {
      // console.log(`true: ${f}`)
      const nextParam = argsv[i + 1];
      if (nextParam && !nextParam.startsWith(`--`)) {
        argsv[i + 1] = '';
      }
      return false;
    } else {
      // console.log(`false: ${f}`)
    }
    return true;
  }).filter(f => !!f);
  return argsv;
}


export function globalArgumentsParser(argsv: string[]) {

  let options: RootArgsType = require('minimist')(argsv);
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
    error(`argument --findNearestProjectType needs to be library type:\n ${LibTypeArr.join(', ')}`, false, true);
  }
  if (_.isBoolean(findNearestProjectTypeWithGitRoot)) {
    error(`argument --findNearestProjectTypeWithGitRoot needs to be library type:\n ${LibTypeArr.join(', ')}`, false, true);
  }

  if (!!findNearestProjectWithGitRoot) {
    findNearestProject = findNearestProjectWithGitRoot;
  }
  if (_.isString(findNearestProjectTypeWithGitRoot)) {
    findNearestProjectType = findNearestProjectTypeWithGitRoot;
  }

  if (_.isString(cwdFromArgs)) {
    if (findNearestProject || _.isString(findNearestProjectType)) {
      // console.log('look for nearest')
      var nearest = Project.nearestTo(cwdFromArgs, {
        type: findNearestProjectType,
        findGitRoot: findProjectWithGitRoot,
      });
      if (!nearest) {
        error(`Not able to find neerest project for arguments: [\n ${argsv.join(',\n')}\n]`, false, true)
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
      error(`Incorrect --cwd argument for args: [\n ${argsv.join(',\n')}\n]`, false, true)
    }

  }
  argsv = removeArg('findNearestProjectType', argsv);

  // process.exit(0)
  Object.keys(options).forEach(argName => {
    argsv = removeArg(argName, argsv);
  });

  // Object
  //   .keys(global)
  //   .filter(key => key.startsWith('tnp'))
  //   .forEach(key => {
  //     console.log(`globa.${key} = ${global[key]}`)
  //   })
  // console.log(argsv)
  // process.exit(0)
  return argsv.join(' ');
}
//#endregion


export const sortKeys = function (obj) {
  if (_.isArray(obj)) {
    return obj.map(sortKeys);
  }
  if (_.isObject(obj)) {
    return _.fromPairs(_.keys(obj).sort().map(key => [key, sortKeys(obj[key])]));
  }
  return obj;
};


//#region @backend
export function crossPlatofrmPath(p: string) {
  return p;
}

export function getEntites(cwd: string): string[] {
  const entityRegEx = /^([A-Z]|\_|[0-9])+\.ts$/;
  return glob
    .sync(`${config.folder.apps}/**/*.ts`, {
      cwd: cwd
    }).filter(p => {

      const isMatchRegex = entityRegEx.test(path.basename(p));
      // if (!isMatchRegex) {
      //   log(`Not match entity patern: ${p + path.basename(p)}`)
      // }
      return isMatchRegex &&
        !p.endsWith('Controller.ts') &&
        !p.endsWith('_REPOSITORY.ts') &&
        !p.endsWith('.REPOSITORY.ts') &&
        !p.endsWith('Repository.ts') &&
        !p.endsWith('Service.ts') &&
        !p.endsWith('.d.ts') &&
        !p.endsWith('.spec.ts') &&
        !p.endsWith('.component.ts') &&
        !p.endsWith('.module.ts') &&
        !p.endsWith('.service.ts') &&
        !p.endsWith('.model.ts') &&
        !(['index.ts', 'app.ts', 'controllers.ts', 'entities.ts'].includes(path.basename(p)));
    })
}


export function getControllers(cwd: string): string[] {
  return glob
    .sync(`${config.folder.apps}/**/*Controller.ts`, {
      cwd: cwd
    })
}



export function paramsFrom(command: string) {
  return _.kebabCase(command);
}

export function match(name: string, argv: string[]): { isMatch: boolean; restOfArgs: string[] } {
  let isMatch = false;
  let restOfArgs = argv;

  isMatch = !!argv.find((vv, i) => {
    const nameInKC = paramsFrom(name)
      .replace(/\$/g, '')
      .replace(/\-/g, '')
      .replace(/\:/g, '')
      .replace(/\_/g, '')
      .toLowerCase()
    const argInKC = paramsFrom(vv)
      .replace(/\$/g, '')
      .replace(/\-/g, '')
      .replace(/\:/g, '')
      .replace(/\_/g, '')
      .toLowerCase()

    const condition = (nameInKC === argInKC)
    if (condition) {
      restOfArgs = _.slice(argv, i + 1, argv.length);
    }
    return condition;
  });
  return { isMatch, restOfArgs };
}

export function fixWebpackEnv(env: Object) {
  _.forIn(env, (v, k) => {
    const value: string = v as any;
    if (value === 'true') env[k] = true;
    if (value === 'false') env[k] = false;
  })
}

export function escapeStringForRegEx(s: string) {
  return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

export function copyFile(sourcePath: string, destinationPath: string,
  transformTextFn?: (input: string) => string, debugMode = false) {

  try {
    if (fse.lstatSync(sourcePath).isDirectory()) {
      warn(`Trying to copy directory as file: ${sourcePath}`, false)
      return
    }
    if (!fs.existsSync(sourcePath)) {
      warn(`[${copyFile.name}] No able to find source of ${sourcePath}`);
      return;
    }
    if (sourcePath === destinationPath) {
      warn(`Trying to copy same file ${sourcePath}`);
      return;
    }
    const destDirPath = path.dirname(destinationPath);
    if (debugMode) console.log('destDirPath', destDirPath)
    if (!fs.existsSync(destDirPath)) {
      fse.mkdirpSync(destDirPath);
    }

    // console.log('path.extname(sourcePath)', path.extname(sourcePath))
    // console.log('config.fileExtensionsText', config.fileExtensionsText)
    if (config.fileExtensionsText.includes(path.extname(sourcePath))) {

      let sourceData = fs.readFileSync(sourcePath).toString();
      if (transformTextFn) {
        sourceData = transformTextFn(sourceData);
      }
      // if (debugMode) {
      //   console.log(`


      //   Write to: ${destinationPath} file:
      //   ============================================================================================
      //   ${sourceData}
      //   ============================================================================================
      //   `);

      // }
      fs.writeFileSync(destinationPath, sourceData, 'utf8')
    } else {

      fse.copyFileSync(sourcePath, destinationPath);
    }


  } catch (e) {
    error(`Error while copying file: ${sourcePath} to ${destinationPath}`, true)
    // console.log(e)
  }

}

// export function clearFiles(files: string[] | string, preserveSymlinks = false) {
//   if (!files) return;
//   const filesPathesToDelete = !Array.isArray(files) ? [files] : files;
//   if (preserveSymlinks) {
//     filesPathesToDelete.forEach(file => {
//       const fpath = path.join(process.cwd(), file);
//       if (HelpersLinks.isLink(fpath)) {
//         run(`rm ${HelpersLinks.removeSlashAtEnd(file)}`).sync()
//       } else {
//         run(`rimraf ${file}`).sync()
//       }
//     })
//   } else {
//     run(`rimraf ${filesPathesToDelete.join(' ')}`).sync()
//   }
//   filesPathesToDelete.forEach(file => {
//     console.log(`Deleted ${file}`)
//   })
// }


// export function getWebpackEnv(params: string): BuildOptions {

//   // console.log('params', params)

//   const regex1 = new RegExp(`(-|--)env.(-|[a-zA-Z])+=([a-zA-Z0-9]|\%|\\|\/|-)+`, 'g')
//   const match = params.match(regex1);

//   // console.log('match', match)

//   const env = {};
//   match.forEach(s => {
//     const split = s.split('=');
//     const key = split[0].replace('--env.', '')
//     const value = split[1];
//     env[key] = decodeURIComponent(value);
//     if ((env[key] as string).search(',') !== -1) {
//       env[key] = (env[key] as string).split(',')
//     }
//   })
//   fixWebpackEnv(env);
//   return env as any;
// }

export class ClassHelper {
  static getMethodName(obj, method): string {
    var methodName = null;
    Object.getOwnPropertyNames(obj).forEach(prop => {
      if (obj[prop] === method) {
        methodName = prop;
      }
    });

    if (methodName !== null) {
      return methodName;
    }

    var proto = Object.getPrototypeOf(obj);
    if (proto) {
      return ClassHelper.getMethodName(proto, method);
    }
    return null;
  }
}

export function tryCopyFrom(source, destination, options = {}) {
  // console.log(`Trying to copy from hahah: ${source} to ${destination}`)
  try {
    fse.copySync(source, destination, _.merge({
      overwrite: true,
      recursive: true
    }, options))
  } catch (e) {
    console.log(e)
    sleep(1);
    tryCopyFrom(source, destination, options)
  }
}

export function tryRemoveDir(dirpath: string, contentOnly = false) {
  try {
    if (contentOnly) {
      rimraf.sync(`${dirpath}/*`)
    } else {
      rimraf.sync(dirpath)
    }
  } catch (e) {
    log(`Trying to remove directory: ${dirpath}`)
    sleep(1);
    tryRemoveDir(dirpath, contentOnly);
  }
}


export function findChildren<T>(location, createFn: (childLocation: string) => T): T[] {
  // console.log('from ' + this.location)

  const notAllowed: RegExp[] = [
    '\.vscode', 'node\_modules',
    ..._.values(config.folder),
    'e2e', 'tmp.*', 'dist.*', 'tests', 'module', 'browser', 'bundle*',
    'components', '\.git', 'bin', 'custom'
  ].map(s => new RegExp(s))

  const isDirectory = source => fse.lstatSync(source).isDirectory()
  const getDirectories = source =>
    fse.readdirSync(source).map(name => path.join(source, name)).filter(isDirectory)

  let subdirectories = getDirectories(location)
    .filter(f => {
      const folderNam = path.basename(f);
      return (notAllowed.filter(p => p.test(folderNam)).length === 0);
    })

  return subdirectories
    .map(dir => {
      // console.log('child:', dir)
      return createFn(dir);
    })
    .filter(c => !!c)
}


export function getRecrusiveFilesFrom(dir): string[] {
  let files = [];
  const readed = fs.readdirSync(dir).map(f => {
    const fullPath = path.join(dir, f);
    // console.log(`is direcotry ${fs.lstatSync(fullPath).isDirectory()} `, fullPath)
    if (fs.lstatSync(fullPath).isDirectory()) {
      getRecrusiveFilesFrom(fullPath).forEach(aa => files.push(aa))
    }
    return fullPath;
  })
  if (Array.isArray(readed)) {
    readed.forEach(r => files.push(r))
  }
  return files;
}



/**
 * Get the most recent changes file in direcory
 * @param dir absoulute path to file
 */
export function getMostRecentFileName(dir): string {
  let files = getRecrusiveFilesFrom(dir);

  // use underscore for max()
  return underscore.max(files, (f) => {
    // console.log(f);
    // ctime = creation time is used
    // replace with mtime for modification time
    // console.log( `${fs.statSync(f).mtimeMs} for ${f}`   )
    return fs.statSync(f).mtimeMs;

  });
}

export function getMostRecentFilesNames(dir): string[] {

  const allFiles = getRecrusiveFilesFrom(dir);
  const mrf = getMostRecentFileName(dir);
  const mfrMtime = fs.lstatSync(mrf).mtimeMs;

  return allFiles.filter(f => {
    const info = fs.lstatSync(f);
    return (info.mtimeMs === mfrMtime && !info.isDirectory())
  })
}



export function getLinesFromFiles(filename: string, lineCount?: number) {
  return new Promise<string[]>((resolve, reject) => {
    let stream = fs.createReadStream(filename, {
      flags: "r",
      encoding: "utf-8",
      fd: null,
      mode: 438, // 0666 in Octal
      // bufferSize: 64 * 1024 as any
    });

    let data = "";
    let lines = [];
    stream.on("data", function (moreData) {
      data += moreData;
      lines = data.split("\n");
      // probably that last line is "corrupt" - halfway read - why > not >=
      if (lines.length > lineCount + 1) {
        stream.destroy();
        lines = lines.slice(0, lineCount); // junk as above
        resolve(lines);
      }
    });

    stream.on("error", function () {
      reject(`Error reading ${filename}`);
    });

    stream.on("end", function () {
      resolve(lines);
    });
  })

};

//#endregion

export function uniqArray(array: any[]) {
  var seen = {};
  return array.filter(function (item) {
    return seen.hasOwnProperty(item) ? false : (seen[item] = true);
  });
}

const AsyncFunction = (async () => { }).constructor;
// const GeneratorFunction = (function* () { }).constructor as any;

export async function runSyncOrAsync(fn: Function, args?: any[]) {
  if (_.isUndefined(fn)) {
    return;
  }
  // let wasPromise = false;
  let promisOrValue = fn(args);
  if (promisOrValue instanceof Promise) {
    // wasPromise = true;
    promisOrValue = Promise.resolve(promisOrValue)
  }
  // console.log('was promis ', wasPromise)
  return promisOrValue;
}


export function arrayMoveElementBefore(arr: any[], a: any, b: any) {
  let indexA = arr.indexOf(a);
  _.pullAt(arr, indexA);
  let indexB = arr.indexOf(b);
  if (indexB === 0) {
    arr.unshift(a);
  } else {
    arr = arr.splice(indexB - 1, 0, a);
  }
  return arr;
}
export function arrayMoveElementAfterB(arr: any[], a: any, b: any) {
  let indexA = arr.indexOf(a);
  _.pullAt(arr, indexA);
  let indexB = arr.indexOf(b);
  if (indexB === arr.length - 1) {
    arr.push(a);
  } else {
    arr = arr.splice(indexB + 1, 0, a);
  }
  return arr;
}


export function checkValidNpmPackageName(pkg) {
  if (!_.isString(pkg) || pkg.length > 214) return false;
  return new RegExp('^(?:@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*(\@.+$)?').test(pkg);
}


export class Range {

  static from(from: number) {
    // const self = this;
    return {
      to(to: number) {
        return new Range(from, to);
      }
    }
  }

  constructor(
    public from: number,
    public to: number) {
    if (_.isNative(from) || _.isNative(to)) {
      throw `This Range type is only for positive numbers`
    }
  }

  get length() {
    return this.to - this.from;
  }

  get array() {
    const arr = [];
    for (let index = this.from; index <= this.to; index++) {
      arr.push(index);
    }
    return arr;
  }

  contains(anotherRangeOrNumber: Range | number) {
    if (_.isNumber(anotherRangeOrNumber)) {
      return anotherRangeOrNumber >= this.from && anotherRangeOrNumber <= this.to;
    }
    anotherRangeOrNumber = anotherRangeOrNumber as Range;

    return (anotherRangeOrNumber.from >= this.from && anotherRangeOrNumber.to <= this.to);
  }

}
