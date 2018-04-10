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



    constructor(private project: Project) {
        // console.log(project)

    }



    readonly PREFIX_BASELINE_SITE = '__'

    get files() {
        this.__checkBaselineSiteStructure()
        const self = this;
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
                    let globPath = path.join(self.getPathToBaseline(), customizableFileOrFolder)
                    if (!fs.existsSync(globPath)) {
                        error(`Custombizable forder doesn't exist: ${globPath}`)
                    }
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

    get merge() {
        const self = this;
        return {
            /**
                 * Join baseline file to site when changed
                 * @param baselineFilePath File located in baselinem, relative path eg. src/file.ts
                 */
            baselineFile(baselineFilePath: string) {
                const baselineFileInCustomPath = path.join(self.project.location, config.folder.custom, baselineFilePath)
                const baselineFileIsInCustom = fs.existsSync(baselineFileInCustomPath);
                const joinFilePath = path.join(self.project.location, baselineFilePath)
                const baselineAbsoluteLocation = path.join(self.getPathToBaseline(), baselineFilePath)
                if (baselineFileIsInCustom) {

                    copyFile(baselineAbsoluteLocation, self.getPrefixedPathInJoin(baselineFilePath))
                    copyFile(baselineFileInCustomPath, joinFilePath);
                } else {
                    copyFile(baselineAbsoluteLocation, joinFilePath)
                }
            },

            /**
             * Join custom file to site when changed
             * @param customFile File located in /custom folder, relative path without custom eg. src/file.ts
             */
            siteCustomFile(customFile: string) {
                const baselineFileInCustomPath = path.join(self.project.location, config.folder.custom, customFile)
                const cusomomFileEquivalentInBaseline = path.join(self.getPathToBaseline(), customFile)
                const customFileEquivalentExistInBaseline = fs.existsSync(cusomomFileEquivalentInBaseline);
                const joinFilePath = path.join(self.project.location, customFile)
                if (customFileEquivalentExistInBaseline) {
                    copyFile(cusomomFileEquivalentInBaseline, self.getPrefixedPathInJoin(customFile))
                    copyFile(baselineFileInCustomPath, joinFilePath);
                } else {
                    copyFile(baselineFileInCustomPath, joinFilePath)
                }
            }
        }
    }


    private get join() {
        const self = this;
        return {
            allBaselineSiteFiles() {
                self.__checkBaselineSiteStructure()
                let baselineFiles: string[] = this.files.allBaselineFiles;
                let customFiles: string[] = this.files.allCustomFiles;

                const baselineReplacePath = path.join(self.project.location, 'node_modules', self.project.baseline.name, self.project.name);
                baselineFiles = baselineFiles.map(f => f.replace(baselineReplacePath, ''))

                const customReplacePath = path.join(self.project.location, config.folder.custom);
                customFiles = customFiles.map(f => f.replace(customReplacePath, ''))
                baselineFiles.forEach(baselineFile => self.merge.baselineFile(baselineFile));
            },
            get watch() {
                return {
                    baselineFileChange(filePath: string) {
                        self.merge.baselineFile(filePath);
                    },
                    siteFileChange(filePath: string) {
                        self.merge.siteCustomFile(filePath);
                    }
                }
            }
        }
    }

    private prefix(file: string, prefix: string) {
        const base = path.basename(file);
        file = file.replace(base, '');
        return path.join(file, prefix, base);
    }

    init() {
        // remove customizable
        this.project.customizableFilesAndFolders.forEach(customizable => {
            this.project.run(`tnp rimraf ${customizable}`)
        });
        // rejoin baseline/site files
        this.join.allBaselineSiteFiles()

        // watch and rejoin baseline/site changed files
        this.monitor((absolutePath, event, isCustomFolder) => {
            console.log(`Event: ${chalk.bold(event)} for file ${absolutePath}`)
            if (isCustomFolder) {
                this.join.watch.siteFileChange(absolutePath);
            } else {
                this.join.watch.baselineFileChange(absolutePath);
            }
        })
    }

    private monitor(callback: (absolutePath: string, event: FileEvent, isCustomFolder: boolean) => any) {
        this.watchFilesAndFolders(this.project.baseline.location, this.project.baseline.customizableFilesAndFolders, callback);
        this.watchFilesAndFolders(this.project.location, [config.folder.custom], callback)
    }

    private watchFilesAndFolders(location: string, customizableFilesOrFolders: string[],
        filesEventCallback: (absolutePath: string, event: FileEvent, isCustomFolder: boolean) => any, ) {

        this.__checkBaselineSiteStructure()

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


    private __checkBaselineSiteStructure() {
        if (!this.project.baseline) {
            error(`There is no baseline project for "${this.project.name}" in ${this.project.location}`)
        }
    }


    private getPrefixedPathInJoin(relativeFilePath: string) {
        const ext = path.extname(relativeFilePath);
        const basename = path.basename(relativeFilePath, ext);
        const dirPath = path.dirname(relativeFilePath);
        const res = path.join(this.project.location, dirPath, basename, this.PREFIX_BASELINE_SITE, ext);
        return res;
    }

    private getPathToBaseline() {
        const baselinePath = this.project.type === 'workspace' ? this.project.baseline.name
            : path.join(this.project.baseline.parent.name, this.project.baseline.name)

        return path.join(
            this.project.location,
            config.folder.node_modules,
            baselinePath
        );
    }


}