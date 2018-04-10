import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
import * as watch from 'watch'
// local
import { Project } from "./base-project";
import { LibType, RecreateFile, FileEvent } from "../models";
import { copyFile } from '../helpers';
import config from '../config';
import { error } from '../messages';
import chalk from 'chalk';




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

    get files() {
        const self = this;
        self.checkBaselineSiteStructure()
        return {
            get allCustomFiles() {

                const globPath = path.join(
                    self.project.location,
                    config.folder.custom);
                const files = glob.sync(`${globPath}/**/*.*`);
                return files;
            },
            get allBaselineFiles() {

                let files = [];
                // console.log('CUSTOMIZABLE', this.project.baseline.customizableFilesAndFolders)

                self.project.baseline.customizableFilesAndFolders.forEach(customizableFileOrFolder => {
                    let globPath = self.getPathToBaselineFrom(self.project, customizableFileOrFolder)
                    if (fs.statSync(globPath).isDirectory()) {
                        const globFiles = glob.sync(`${globPath}/**/*.*`);
                        files = files.concat(globFiles);
                    } else {
                        files.push(globPath)
                    }

                })
                // console.log('OUTPUT', files.map(f => path.basename(f)))
                return files;
            },
            get allJoinedFiles() {
                let files = [];
                // console.log('CUSTOMIZABLE', this.project.baseline.customizableFilesAndFolders)

                self.project.customizableFilesAndFolders.forEach(customizableFileOrFolder => {
                    let globPath = path.join(self.project.location, customizableFileOrFolder)
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
        }
    }



    private getPathToBaselineFrom(project: Project, customzableFolder: string) {
        const baselinePath = this.project.type === 'workspace' ? this.project.baseline.name
            : path.join(this.project.baseline.parent.name, this.project.baseline.name)

        return path.join(
            this.project.location,
            config.folder.node_modules,
            baselinePath,
            customzableFolder
        );
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
    private get joinWhen() {
        const self = this;
        return {
            baselineChnage(baselineFiles: string[], customFiles: string[]) {
                self.checkBaselineSiteStructure()
                const baselineReplacePath = path.join(self.project.location, 'node_modules', self.project.baseline.name, self.project.name);
                baselineFiles = baselineFiles.map(f => f.replace(baselineReplacePath, ''))

                const customReplacePath = path.join(self.project.location, config.folder.custom);
                customFiles = customFiles.map(f => f.replace(customReplacePath, ''))



                baselineFiles.forEach(baselineFile => {
                    const existInCustom = customFiles.includes(baselineFile);
                    const baselineAbsoluteLocation = path.join(
                        baselineReplacePath,
                        baselineFile
                    );
                    const siteAbsoluteDestination = path.join(
                        self.project.location,
                        existInCustom ? self.prefix(baselineFile,
                            self.PREFIX_BASELINE_SITE) : baselineFile
                    );
                    copyFile(baselineAbsoluteLocation, siteAbsoluteDestination)
                    if (existInCustom) {
                        const customAbsoluteFilePath = path.join(
                            self.project.location,
                            config.folder.custom,
                            baselineFile
                        )
                        copyFile(customAbsoluteFilePath, siteAbsoluteDestination)
                    }

                });
            },
            customChnage(customFiles: string[], joinedLocationFiles: string[]) {

            }
        }
    }

    private prefix(file: string, prefix: string) {
        const base = path.basename(file);
        file = file.replace(base, '');
        return path.join(file, prefix, base);
    }

    init() {
        // this.joinWhenBaselineChnage(this.baselineFiles, this.customFiles);
        this.joinWhen.baselineChnage(this.files.allBaselineFiles, this.files.allCustomFiles)
        this.monitor((absolutePath, event, isCustomFolder) => {
            console.log(`Event: ${chalk.bold(event)} for file ${absolutePath}`)
            if (isCustomFolder) {
                this.joinWhen.customChnage([absolutePath], this.files.allJoinedFiles);
            } else {
                this.joinWhen.baselineChnage([absolutePath], this.files.allCustomFiles)
            }
        })
    }

    monitor(callback: (absolutePath: string, event: FileEvent, isCustomFolder: boolean) => any) {
        this.monitorFilesAndFolders(this.project.baseline.location, this.project.baseline.customizableFilesAndFolders, callback);
        this.monitorFilesAndFolders(this.project.location, [config.folder.custom], callback)
    }

    private monitorFilesAndFolders(location: string, customizableFilesOrFolders: string[],
        filesEventCallback: (absolutePath: string, event: FileEvent, isCustomFolder: boolean) => any, ) {



        this.checkBaselineSiteStructure()

        const isCustomFolder = (customizableFilesOrFolders.filter(f => f === config.folder.custom).length === 1);

        customizableFilesOrFolders.forEach(baselieFileOrFolder => {
            const fileOrFolderPath = path.join(location, baselieFileOrFolder)
            if (!fs.existsSync(fileOrFolderPath)) {
                error(`File ${chalk.bold(chalk.underline(fileOrFolderPath))} doesn't exist and can't be monitored.`)
            }
            if (fs.statSync(fileOrFolderPath).isDirectory()) {
                console.log(`Monitoring directory: ${fileOrFolderPath}`)
                watch.watchTree(fileOrFolderPath, (f, curr, prev) => {
                    if (typeof f == "object" && prev === null && curr === null) {
                        // Finished walking the tree
                    } else if (prev === null) {
                        filesEventCallback(f as any, 'created', isCustomFolder)
                    } else if (curr.nlink === 0) {
                        filesEventCallback(f as any, 'removed', isCustomFolder)
                    } else {
                        filesEventCallback(f as any, 'changed', isCustomFolder)
                        // f was changed
                    }
                })
            } else {
                console.log(`Monitoring file: ${fileOrFolderPath}`)
                fs.watch(fileOrFolderPath, { recursive: true }, (event: 'rename' | 'change', filename) => {
                    // console.log(`NODE FS WATCH Event: ${event} for ${filename}`)
                    filesEventCallback(fileOrFolderPath as any, event === 'change' ? 'changed' : 'rename', isCustomFolder)
                })
            }


        });

    }


}