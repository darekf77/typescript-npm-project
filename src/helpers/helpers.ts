//#region @backend
import chalk from 'chalk';
import * as  underscore from 'underscore';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as glob from 'glob';
import * as rimraf from "rimraf";
import { sleep } from 'sleep';
import { ProjectFrom } from '../project';
import { Project } from '../project';
import { BuildOptions } from '../models';
import { error, warn } from "../helpers";
//#endregion

import * as _ from 'lodash'



import { config } from '../config';


//#region @backend
export function crossPlatofrmPath(p: string) {
  if (process.platform === 'win32') {
    return p.replace(/\\/g, '/');
  }
  return p;
}

export function getEntites(cwd: string): string[] {
  return glob
    .sync(`${config.folder.apps}/**/*.ts`, {
      cwd: cwd
    }).filter(p =>
      !p.endsWith('Controller.ts') &&
      !p.endsWith('_REPOSITORY.ts') &&
      !p.endsWith('.REPOSITORY.ts') &&
      !p.endsWith('Repository.ts') &&
      !p.endsWith('Service.ts') &&
      !p.endsWith('.d.ts') &&
      !p.endsWith('.spec.ts') &&
      !(['index.ts', 'app.ts','controllers.ts','entities.ts'].includes(path.basename(p)))
    )
}


export function getControllers(cwd: string): string[] {
  return glob
    .sync(`${config.folder.apps}/**/*Controller.ts`, {
      cwd: cwd
    })
}




export function nearestProjectTo(location: string) {
  // console.log('nearestPorjectLocaiont', location)
  const project = ProjectFrom(location);
  if (project) {
    return project;
  }
  location = path.join(location, '..');
  if (!fs.existsSync(location)) return undefined;
  return ProjectFrom(path.resolve(location));
}


export function paramsFrom(command: string) {
  return _.kebabCase(command);
}

export function match(name: string, argv: string[]): { isMatch: boolean; restOfArgs: string[] } {
  let isMatch = false;
  let restOfArgs = argv;

  isMatch = !!argv.find((vv, i) => {
    const nameInKC = paramsFrom(name);
    const isWithoutDash = name.startsWith('$');
    const argInKC = paramsFrom(vv);

    const condition =
      (isWithoutDash && argInKC === `${nameInKC}`)
      || argInKC === `${nameInKC}`
      || argInKC === `${nameInKC.substr(0, 1)}`;
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

export function copyFile(sousrce: string, destination: string,
  transformTextFn?: (input: string) => string, debugMode = false) {

  try {
    if (fse.lstatSync(sousrce).isDirectory()) {
      warn(`Trying to copy directory as file: ${sousrce}`, false)
      return
    }
    if (!fs.existsSync(sousrce)) {
      warn(`[${copyFile.name}] No able to find source of ${sousrce}`);
      return;
    }
    if (sousrce === destination) {
      warn(`Trying to copy same file ${sousrce}`);
      return;
    }
    const destDirPath = path.dirname(destination);
    if (debugMode) console.log('destDirPath', destDirPath)
    if (!fs.existsSync(destDirPath)) {
      fse.mkdirpSync(destDirPath);
    }

    let sourceData = fs.readFileSync(sousrce).toString();
    if (transformTextFn) {
      sourceData = transformTextFn(sourceData);
    }
    if (debugMode) {
      console.log(`


      Write to: ${destination} file:
      ============================================================================================
      ${sourceData}
      ============================================================================================
      `)
    }

    // process.exit(0)
    // console.log(`Copy from ${sousrce.slice(-20)} to ${destination.slice(-20)}`)
    fs.writeFileSync(destination, sourceData, 'utf8')
  } catch (e) {
    error(`Error while copying file: ${sousrce} to ${destination}`, true)
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


export function getWebpackEnv(params: string): BuildOptions {

  // console.log('params', params)

  const regex1 = new RegExp(`(-|--)env.(-|[a-zA-Z])+=([a-zA-Z0-9]|\%|\\|\/|-)+`, 'g')
  const match = params.match(regex1);

  // console.log('match', match)

  const env = {};
  match.forEach(s => {
    const split = s.split('=');
    const key = split[0].replace('--env.', '')
    const value = split[1];
    env[key] = decodeURIComponent(value);
    if ((env[key] as string).search(',') !== -1) {
      env[key] = (env[key] as string).split(',')
    }
  })
  fixWebpackEnv(env);
  return env as any;
}

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
    console.log(`Trying to remove directory: ${dirpath}`)
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

export async function runSyncOrAsync(fn: Function) {
  if (_.isUndefined(fn)) {
    return;
  }
  // let wasPromise = false;
  let promisOrValue = fn()
  if (promisOrValue instanceof Promise) {
    // wasPromise = true;
    promisOrValue = Promise.resolve(promisOrValue)
  }
  // console.log('was promis ', wasPromise)
  return promisOrValue;
}

export function ReorganizeArray<T>(arr: T[]) {
  return {
    moveElement(a: T) {
      return {
        before(b: T): T[] {
          let indexA = arr.indexOf(a);
          _.pullAt(arr, indexA);
          let indexB = arr.indexOf(b);
          if (indexB === 0) {
            arr.unshift(a);
          } else {
            arr = arr.splice(indexB - 1, 0, a);
          }
          return arr;
        },
        after(b: T) {
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
      }
    }
  }
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
