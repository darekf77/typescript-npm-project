import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
// local
import { Project } from "./base-project";
import { LibType, RecreateFile } from "../models";
import { copyFile } from '../helpers';
import config from '../config';
import { error } from '../messages';



export class BaselineSiteJoin {

    private checkBaselineSiteStructure() {
        if (!this.project.baseline) {
            error(`There is no baseline project for "${this.project.name}" in ${this.project.location}`)
        }
    }

    constructor(private project: Project) {
        // console.log(project)

    }

    readonly PREFIX_BASELINE_SITE = '__'

    getCustomFiles() {
        this.checkBaselineSiteStructure()
        const files = glob.sync(path.join(
            this.project.location,
            config.folder.custom)
        )
        return files;
    }

    getPathToBaselineFrom(project: Project, customzableFolder: string) {
        const baselinePath = this.project.type === 'workspace' ? this.project.baseline.name
            : path.join(this.project.baseline.parent.name, this.project.baseline.name)

        return path.join(
            this.project.location,
            config.folder.node_modules,
            baselinePath,
            customzableFolder
        );
    }

    getBaselineFiles() {
        this.checkBaselineSiteStructure()
        let files = [];
        // console.log('CUSTOMIZABLE', this.project.baseline.customizableFilesAndFolders)

        this.project.baseline.customizableFilesAndFolders.forEach(customizableFileOrFolder => {
            let globPath = this.getPathToBaselineFrom(this.project, customizableFileOrFolder)
            if (fs.statSync(globPath).isDirectory()) {
                const globFiles = glob.sync(`${globPath}/**/*.*`);
                files = files.concat(globFiles);
            } else {
                files.push(globPath)
            }

        })
        // console.log('OUTPUT', files.map(f => path.basename(f)))
        return files;
    }


    /**
     * 
     * @param baselineFiles 
     * example "<cwd>/node_modules/baseline/ss-common-ui/src/User.ts"
     * example "<cwd>/node_modulesbaseline/ss-common-ui/components/module.ts"
     * 
     * @param customFiles 
     * example "<cwd>/custom/src/User.ts"
     * example "<cwd>/custom/components/module.ts"
     */
    private joinWhenBaselineChnage(baselineFiles: string[], customFiles: string[]) {
        this.checkBaselineSiteStructure()
        const baselineReplacePath = path.join(this.project.location, 'node_modules', this.project.baseline.name, this.project.name);
        baselineFiles = baselineFiles.map(f => f.replace(baselineReplacePath, ''))

        const customReplacePath = path.join(this.project.location, config.folder.custom);
        customFiles = customFiles.map(f => f.replace(customReplacePath, ''))



        baselineFiles.forEach(baselineFile => {
            const existInCustom = customFiles.includes(baselineFile);
            const baselineAbsoluteLocation = path.join(
                baselineReplacePath,
                baselineFile
            );
            const siteAbsoluteDestination = path.join(
                this.project.location,
                existInCustom ? this.prefix(baselineFile,
                    this.PREFIX_BASELINE_SITE) : baselineFile
            );
            copyFile(baselineAbsoluteLocation, siteAbsoluteDestination)
            if (existInCustom) {
                const customAbsoluteFilePath = path.join(
                    this.project.location,
                    config.folder.custom,
                    baselineFile
                )
                copyFile(customAbsoluteFilePath, siteAbsoluteDestination)
            }

        });

    }

    private prefix(file: string, prefix: string) {
        const base = path.basename(file);
        file = file.replace(base, '');
        return path.join(file, prefix, base);
    }

    baselineSiteJoinFiles() {



    }


}