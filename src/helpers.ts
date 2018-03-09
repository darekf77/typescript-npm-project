import * as _ from 'lodash'
import * as fs from 'fs';
import * as path from 'path';
import * as rimraf from "rimraf";
import * as glob from "glob";
import * as os from "os";

import config from 'config';
import { error, info, warn } from "./messages";
import { run } from "./process";
import { constants } from 'zlib';
import { BuildOptions, RuleDependency } from './models';
import { Project } from './project';
import { HelpersLinks } from "./helpers-links";

export function fixWebpackEnv(env: Object) {
    _.forIn(env, (v, k) => {
        const value: string = v as any;
        if (value === 'true') env[k] = true;
        if (value === 'false') env[k] = false;
    })
}

export function copyFile(sousrce: string, destination: string) {
    if (!fs.existsSync(sousrce)) {
        warn(`[${copyFile.name}] No able to find source of ${sousrce}`);
        return;
    }
    if (sousrce === destination) {
        warn(`Trying to copy same file ${sousrce}`);
        return;
    }
    // console.log(`Copy from ${sousrce.slice(-20)} to ${destination.slice(-20)}`)
    fs.writeFileSync(destination, fs.readFileSync(sousrce), 'utf8')
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

export function deleteFiles(filesPattern: string, options?: { cwd?: string, filesToOmmit?: string[] }) {
    let { cwd, filesToOmmit } = options;
    if (!cwd) {
        cwd = process.cwd()
    }
    return new Promise<string[]>((resolve, reject) => {
        glob(filesPattern, { cwd }, (err, files) => {

            if (err) {
                reject(err);
                return
            }
            if (Array.isArray(filesToOmmit) && filesToOmmit.length > 0) {
                files = files.filter(f => {
                    return filesToOmmit.filter(ommitFile => {
                        return (path.resolve(path.join(cwd, ommitFile)) == path.resolve(path.join(cwd, f)))
                    }).length === 0;
                })
            }

            clearFiles(files)
            resolve(files);
        })
    })
}

export function copyFiles(filesPattern: string, destinationFolder: string, options?: { cwd?: string, filesToOmmit?: string[] }) {
    let { cwd, filesToOmmit } = options;
    if (!cwd) {
        cwd = process.cwd()
    }
    return new Promise<string[]>((resolve, reject) => {
        glob(filesPattern, { cwd }, (err, files) => {
            if (err) {
                reject(err);
                return
            }
            if (Array.isArray(filesToOmmit) && filesToOmmit.length > 0) {
                files = files.filter(f => {
                    return filesToOmmit.filter(ommitFile => {
                        return (path.resolve(path.join(cwd, ommitFile)) == path.resolve(path.join(cwd, f)))
                    }).length === 0;
                })
            }

            files.forEach(file => {
                const fileSource = file;
                const fileDestination = path.join(destinationFolder, file);
                const folder = fileDestination.substring(0, fileDestination.length - path.basename(fileDestination).length);
                try {
                    if (!fs.existsSync(folder)) {
                        run(`tnp mkdirp ${folder}`).sync();
                    }
                    run(`cp ${fileSource} ${fileDestination}`, { cwd }).sync();
                } catch (error) {
                    console.log(error)
                }

            });
            resolve(files);
        })
    })
}


export function getWebpackEnv(params: string): BuildOptions {
    const regex1 = new RegExp(`(-|--)env.(-|[a-zA-Z])+=([a-zA-Z]|\\|\/|-)+`, 'g')
    const match = params.match(regex1);
    const env = {};
    match.forEach(s => {
        const split = s.split('=');
        const key = split[0].replace('--env.', '')
        const value = split[1];
        env[key] = value;
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

export function environmentName(filename: string, LOCAL_ENVIRONMENT_NAME: string) {
    let name = path.basename(filename)
    name = name.replace(/\.js$/, '')
    name = name.replace('environment', '')
    name = name.replace(/\./g, '');
    return name === '' ? LOCAL_ENVIRONMENT_NAME : name
}