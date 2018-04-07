import * as fs from 'fs';
import * as fse from "fs-extra";
import * as path from 'path';
// local
import { Project } from "./base-project";
import { BuildDir, LibType } from "../models";
import { questionYesNo } from "../process";
import { error, info, warn } from "../messages";
import config from "../config";

export abstract class BaseProjectLib extends Project {

    projectSpecyficFiles() {
        const files = [
            'index.js',
            'index.d.ts',
            'index.js.map'
        ]
        if (this.type === 'isomorphic-lib') files.push('browser')
        if (this.type === 'angular-lib') files.push('module')
        return files;
    }

    abstract buildLib(outDir: BuildDir, prod?: boolean, watch?: boolean);

    private chekcIfProjectIsLib() {
        const libs: LibType[] = ['angular-lib', 'isomorphic-lib'];
        if (!libs.includes(this.type)) {
            error(`This project "${this.name}" isn't library project (${libs.join(',')}).`)
        }
    }

    public async publish() {
        this.chekcIfProjectIsLib()
        await questionYesNo(`Publish on npm version: ${Project.Current.version} ?`, () => {
            this.run('npm publish', {
                cwd: path.join(this.location, config.folder.bundle),
                output: true
            }).sync()
        })
    }

    public async release(prod = false) {
        this.chekcIfProjectIsLib()
        const newVersion = Project.Current.versionPatchedPlusOne;
        await questionYesNo(`Release new version: ${newVersion} ?`, async () => {
            this.run(`npm version patch`).sync()
            this.run(`tnp clear:bundle`).sync();
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
        this.chekcIfProjectIsLib()
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
                const options: fse.CopyOptions = {
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

}