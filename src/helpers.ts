//#region @backend
import chalk from 'chalk';
import * as  underscore from 'underscore';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as rimraf from "rimraf";
import { run } from "./process";
import { sleep } from 'sleep';
import { ProjectFrom } from './index';
import * as dateformat from "dateformat";
//#endregion

import * as _ from 'lodash'

import { error, warn } from "./messages";
import { BuildOptions } from './models';
import { config } from './config';


export function walkObject(obj: Object, callBackFn: (lodashPath: string, isPrefixed: boolean) => void, lodashPath = '') {
  lodashPath = (lodashPath === '') ? `` : `${lodashPath}.`;
  Object.keys(obj).forEach(key => {
    const contactedPath = `${lodashPath}${key}`
    callBackFn(contactedPath, key.startsWith('$'))
    const v = obj[key];
    const isObject = _.isObject(v)
    const isArray = _.isArray(v)
    if (isObject) {
      walkObject(v, callBackFn, contactedPath)
    } else if (isArray) {
      (v as Array<any>).forEach((elem, i) => {
        walkObject(elem, callBackFn, `${lodashPath}${key}[${i}]`)
      })
    }
  })
}


//#region @backend
export function crossPlatofrmPath(p: string) {
  if (process.platform === 'win32') {
    return p.replace(/\\/g, '/');
  }
  return p;
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
  transformTextFn?: (input: string) => string) {

  try {
    if (!fs.existsSync(sousrce)) {
      warn(`[${copyFile.name}] No able to find source of ${sousrce}`);
      return;
    }
    if (sousrce === destination) {
      warn(`Trying to copy same file ${sousrce}`);
      return;
    }
    const destDirPath = path.dirname(destination);
    // console.log('destDirPath', destDirPath)
    if (!fs.existsSync(destDirPath)) {
      run(`mkdirp ${destDirPath}`).sync()
    }

    let sourceData = fs.readFileSync(sousrce).toString();
    if (transformTextFn) {
      sourceData = transformTextFn(sourceData);
    }

    // process.exit(0)
    // console.log(`Copy from ${sousrce.slice(-20)} to ${destination.slice(-20)}`)
    fs.writeFileSync(destination, sourceData, 'utf8')
  } catch (e) {
    error(`Error while copying file: ${sousrce} to ${destination}`, true)
    // console.log(e)
  }

}


export function compilationWrapper(fn: () => void, taskName: string = 'Task', executionType: 'Compilation' | 'Code execution' = 'Compilation') {
  function date() {
    return `[${dateformat(new Date(), 'HH:MM:ss')}]`;
  }
  if (!fn || !_.isFunction(fn)) {
    error(`${executionType} wrapper: "${fs}" is not a function.`)
  }

  if (isAsyncFunction(fn)) {
    return new Promise(async (resolve, reject) => {
      try {
        console.log(chalk.gray(`${date()} ${executionType} of "${chalk.bold(taskName)}" started...`))
        await fn()
        console.log(chalk.green(`${date()} ${executionType} of "${chalk.bold(taskName)}" finish OK...`))
        resolve()
      } catch (error) {
        console.log(chalk.red(error));
        console.log(`${date()} ${executionType} of ${taskName} ERROR`)
        reject(error)
      }
    })
  } else {
    try {
      console.log(chalk.gray(`${date()} ${executionType} of "${chalk.bold(taskName)}" started...`))
      fn()
      console.log(chalk.green(`${date()} ${executionType} of "${chalk.bold(taskName)}" finish OK...`))
    } catch (error) {
      console.log(chalk.red(error));
      console.log(`${date()} ${executionType} of ${taskName} ERROR`)
    }
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


export function tryRemoveDir(dirpath) {
  try {
    rimraf.sync(dirpath)
  } catch (e) {
    console.log(`Trying to remove directory: ${dirpath}`)
    sleep(1);
    tryRemoveDir(dirpath);
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

export function isAsyncFunction(fn) {
  return _.isFunction(fn) && fn.constructor.name === 'AsyncFunction';
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


