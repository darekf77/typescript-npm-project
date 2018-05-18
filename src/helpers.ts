import * as _ from 'lodash'
import * as fs from 'fs';
import * as path from 'path';
import * as rimraf from "rimraf";
import * as glob from "glob";
import * as os from "os";
import chalk from 'chalk';
import * as dateformat from "dateformat";

import { error, info, warn } from "./messages";
import { run } from "./process";
import { constants } from 'zlib';
import { BuildOptions, RuleDependency } from './models';
import { Project } from './project/base-project';
import { HelpersLinks } from "./helpers-links";
import { ProjectFrom } from './index';

export function walkObject(obj: Object, callBackFn: (lodashPath: string, isPrefixed: boolean) => void, lodashPath = '') {
  Object.keys(obj).forEach(key => {
    const contactedPath = `${lodashPath}.${key}`
    callBackFn(contactedPath, key.startsWith('$'))
    const v = obj[key];
    const isObject = _.isObject(v)
    const isArray = _.isArray(v)
    if (isObject) {
      walkObject(v, callBackFn, contactedPath)
    } else if (isArray) {
      (v as Array<any>).forEach((elem, i) => {
        walkObject(elem, callBackFn, `${lodashPath}.${key}[${i}]`)
      })
    }
  })
}


export function crossPlatofrmPath(p: string) {
  if (process.platform === 'win32') {
    return p.replace(/\\/g, '/');
  }
  return p;
}

export function nearestProjectTo(location: string) {
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
      run(`tnp mkdirp ${destDirPath}`).sync()
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

export function uniqArray<T=string>(array: any[]) {
  var seen = {};
  return array.filter(function (item) {
    return seen.hasOwnProperty(item) ? false : (seen[item] = true);
  });
}

export function isAsyncFunction(fn) {
  return _.isFunction(fn) && fn.constructor.name === 'AsyncFunction';
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

export function clearFiles(files: string[] | string, preserveSymlinks = false) {
  if (!files) return;
  const filesPathesToDelete = !Array.isArray(files) ? [files] : files;
  if (preserveSymlinks) {
    filesPathesToDelete.forEach(file => {
      const fpath = path.join(process.cwd(), file);
      if (HelpersLinks.isLink(fpath)) {
        run(`rm ${HelpersLinks.removeSlashAtEnd(file)}`).sync()
      } else {
        run(`tnp rimraf ${file}`).sync()
      }
    })
  } else {
    run(`tnp rimraf ${filesPathesToDelete.join(' ')}`).sync()
  }
  filesPathesToDelete.forEach(file => {
    console.log(`Deleted ${file}`)
  })
}


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

