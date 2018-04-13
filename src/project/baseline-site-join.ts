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


interface JoinFilesOptions {
    baselineAbsoluteLocation: string;
}

export class BaselineSiteJoin {



    constructor(private project: Project) {
        // console.log(project)

    }

    getCleanPathes() {
        let baselineFiles: string[] = this.files.allBaselineFiles;
        const baselineReplacePath = this.pathToBaselineThroughtNodeModules;
        baselineFiles = baselineFiles.map(f => f.replace(baselineReplacePath, ''))

        return baselineFiles;
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
                // console.log('CUSTOM FIELS', files)

                return files;
            },
            get allBaselineFiles() {

                let files = [];
                // console.log('CUSTOMIZABLE', this.project.baseline.customizableFilesAndFolders)

                self.project.baseline.customizableFilesAndFolders.forEach(customizableFileOrFolder => {
                    let globPath = path.join(self.pathToBaselineThroughtNodeModules, customizableFileOrFolder)
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
                // console.log('allBaselineFiles', files)

                return files;
            }
        }
    }

    private merge(relativeBaselineCustomPath: string) {

        const baselineFilePathNoExit = this.removeExtension(relativeBaselineCustomPath);

        const baselineAbsoluteLocation = path.join(this.pathToBaselineThroughtNodeModules, relativeBaselineCustomPath)
        const baselineFileInCustomPath = path.join(this.pathToCustom, relativeBaselineCustomPath)

        const joinFilePath = path.join(this.project.location, relativeBaselineCustomPath)


        if (fs.existsSync(baselineFileInCustomPath)) {

            copyFile(baselineAbsoluteLocation, this.getPrefixedPathInJoin(relativeBaselineCustomPath))
            copyFile(baselineFileInCustomPath, joinFilePath, input => {

                // console.log(`baselineFilePathNoExit "${baselineFilePathNoExit}"`)

                const toReplaceImportPath = `${path.join(
                    this.pathToBaselineNodeModulesRelative.replace(/\//g, '//'),
                    baselineFilePathNoExit)}`;
                const replacement = `./${this.getPrefixedBasename(baselineFilePathNoExit)}`;
                // console.log(`toReplaceImportPath "${toReplaceImportPath}" `)
                // console.log(`replacement: "${replacement}"`)


                const res = input.replace(new RegExp(toReplaceImportPath, 'g'), replacement);
                // console.log('AFTER TRANSFORMATION', res)
                // process.exit()
                return res;
            });
        } else {
            copyFile(baselineAbsoluteLocation, joinFilePath)
        }
    }


    private get join() {
        const self = this;
        return {
            allBaselineSiteFiles() {
                self.__checkBaselineSiteStructure()
                const baselineFiles = self.getCleanPathes();
                baselineFiles.forEach(baselineFile => self.merge(baselineFile));
            },
            get watch() {
                return {
                    baselineFileChange(filePath: string) {
                        self.merge(filePath);
                    },
                    siteFileChange(filePath: string) {
                        self.merge(filePath);
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

    watch() {
        this.monitor((absolutePath, event, isCustomFolder) => {
            console.log(`Event: ${chalk.bold(event)} for file ${absolutePath}`)
            if (isCustomFolder) {
                this.join.watch.siteFileChange(absolutePath.replace(this.pathToCustom, ''));
            } else {
                this.join.watch.baselineFileChange(absolutePath.replace(this.pathToBaselineAbsolute, ''));
            }
        })
    }

    init() {
        // remove customizable
        // console.log(this.project.customizableFilesAndFolders);
        // process.exit(0)
        this.project.customizableFilesAndFolders.forEach(customizable => {
            this.project.run(`tnp rimraf ${customizable}`).sync()
        });
        // rejoin baseline/site files
        this.join.allBaselineSiteFiles()
        return this;
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
                console.log(`Monitoring directory: ${fileOrFolderPath} `)
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
                console.log(`Monitoring file: ${fileOrFolderPath} `)
                fs.watch(fileOrFolderPath, { recursive: true }, (event: 'rename' | 'change', filename) => {
                    // console.log(`NODE FS WATCH Event: ${ event } for ${ filename }`)
                    filesEventCallback(fileOrFolderPath as any, event === 'change' ? 'changed' : 'rename', isCustomFolder)
                })
            }


        });

    }


    private __checkBaselineSiteStructure() {
        if (!this.project.baseline) {
            error(`There is no baseline project for "${this.project.name}" in ${this.project.location} `)
        }
    }

    private removeExtension(filePath: string) {
        const ext = path.extname(filePath);
        return path.join(path.dirname(filePath), path.basename(filePath, ext))
    }


    private getPrefixedBasename(relativeFilePath: string) {
        const ext = path.extname(relativeFilePath);
        const basename = path.basename(relativeFilePath, ext)
            .replace(/\/$/g, ''); // replace last part of url /

        return `${this.PREFIX_BASELINE_SITE}${basename}${ext}`;
    }

    private getPrefixedPathInJoin(relativeFilePath: string) {

        const dirPath = path.dirname(relativeFilePath);

        const res = path.join(
            this.project.location,
            dirPath,
            this.getPrefixedBasename(relativeFilePath));

        return res;
    }

    private get pathToBaselineAbsolute() {
        // console.log('this.pathToBaseline', this.pathToBaselineThroughtNodeModules)
        const isInsideWokrspace = (this.project.parent && this.project.parent.type === 'workspace');

        const toReplace = path.join(
            isInsideWokrspace ? (
                path.join(this.project.parent.name, this.project.name))
                : this.project.name
            , config.folder.node_modules)

        // console.log('toReplace', toReplace)
        return this.pathToBaselineThroughtNodeModules.replace(`${toReplace}/`, '')
    }

    private get pathToBaselineThroughtNodeModules() {
        const baselinePath = this.pathToBaselineNodeModulesRelative;

        return path.join(
            this.project.location,
            config.folder.node_modules,
            baselinePath
        );
    }

    private get pathToCustom() {
        return path.join(this.project.location, config.folder.custom);
    }

    private get pathToBaselineNodeModulesRelative() {
        const baselinePath = this.project.type === 'workspace' ? this.project.baseline.name
            : path.join(this.project.baseline.parent.name, this.project.baseline.name)

        return baselinePath;
    }




}