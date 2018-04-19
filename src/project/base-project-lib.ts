import * as _ from 'lodash';
import * as fs from 'fs';
import * as fse from "fs-extra";
import * as path from 'path';
import chalk from 'chalk';

// local
import { Project } from "./base-project";
import { BuildDir, LibType } from "../models";
import { questionYesNo } from "../process";
import { error, info, warn } from "../messages";
import config from "../config";
import { compilationWrapper } from '../helpers';

/**
 * Project ready to be build/publish as npm package.
 * Also ready to be linked as package in workspace.
 *  - isomorphic-lib
 *  - angular-lib
 */
export abstract class BaseProjectLib extends Project {

    projectSpecyficFiles() {
        const files = [
            'index.js',
            'index.d.ts',
            'index.js.map'
        ]
        return files;
    }


    abstract buildLib(outDir: BuildDir, prod?: boolean, watch?: boolean);


    public async publish() {
        this.checkIfReadyForNpm()
        await questionYesNo(`Publish on npm version: ${Project.Current.version} ?`, () => {
            this.run('npm publish', {
                cwd: path.join(this.location, config.folder.bundle),
                output: true
            }).sync()
        })
    }

    public async release(prod = false) {
        this.checkIfReadyForNpm()
        const newVersion = Project.Current.versionPatchedPlusOne;
        await questionYesNo(`Release new version: ${newVersion} ?`, async () => {
            this.run(`npm version patch`).sync()
            this.run(`tnp clear`).sync();
            this.build({
                prod, outDir: config.folder.bundle as 'bundle'
            })
            this.bundleResources()
        }, () => process.exit(0))
        await questionYesNo(`Publish on npm version: ${newVersion} ?`, () => {
            this.run('npm publish', {
                cwd: path.join(this.location, config.folder.bundle),
                output: true
            }).sync()
        })
    }

    public bundleResources() {
        this.checkIfReadyForNpm()
        const bundleFolder = path.join(this.location, config.folder.bundle);
        if (!fs.existsSync(bundleFolder)) fs.mkdirSync(bundleFolder);
        ['package.json'].concat(this.resources).forEach(res => {
            const file = path.join(this.location, res);
            const dest = path.join(bundleFolder, res);
            if (!fs.existsSync(file)) {
                error(`Resource file ${file} does not exist in ${this.location}`)
            }
            if (fs.lstatSync(file).isDirectory()) {
                // console.log('IS DIRECTORY', file)
                // console.log('IS DIRECTORY DEST', dest)
                // this.run(`tnp cpr ${file}/ ${dest}/`).sync()
                const options: fse.CopyOptionsSync = {
                    overwrite: true,
                    recursive: true,
                    errorOnExist: true,
                    filter: (src) => {
                        return !/.*node_modules.*/g.test(src);
                    }
                };
                fse.copySync(file, dest, options);
            } else {
                // console.log('IS FILE', file)
                fse.copyFileSync(file, dest);
            }
        })
        info(`Resources copied to release folder: ${config.folder.bundle}`)
    }



    protected compilationWrapper(fn: () => void, taskName: string = 'Task', executionType?: string) {
        return compilationWrapper(fn, taskName, executionType as any);
    }


}