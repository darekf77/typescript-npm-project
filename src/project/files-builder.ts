import * as fs from 'fs';
import * as path from 'path';
import * as JSON5 from 'json5';
// local
import { Project } from "./base-project";
import { LibType, RecreateFile } from "../models";
import { copyFile } from '../helpers';
import config from '../config';
import { BaselineSiteJoin } from './baseline-site-join';

interface VSCodeSettings {
    'files.exclude': { [files: string]: boolean; }
}


export class FilesRecreator {

    readonly join: BaselineSiteJoin;

    constructor(private project: Project) {
        this.join = new BaselineSiteJoin(project);
    }

    private get commonFilesForAllProjects() {
        return [
            // '.npmrc',
            'tslint.json',
            '.editorconfig'
        ]
    }

    get filesIgnoredBy() {
        const self = this;
        return {
            get vscodeSidebarFilesView() {
                return self.filesIgnoredBy.gitignore.concat([
                    '.gitignore',
                    '.npmignore',
                    '.npmrc',
                    '.babelrc'
                ])
            },
            get gitignore() {
                const gitignoreFiles = [ // for sure ingored
                    config.folder.node_modules,
                    'tmp*',
                    'dist*',
                    'bundle*',
                    'browser',
                    'module',
                    'www'
                ].concat([ // common small files
                    'Thumbs.db',
                    '.DS_Store',
                    'npm-debug.log*'
                ].concat([ // not sure if ignored/needed
                    '.sass-cache',
                    '.sourcemaps'
                ]).concat( // for site ignore auto-generate scr 
                    self.project.isSite ? (
                        self.project.customizableFilesAndFolders
                            .concat(self.project.customizableFilesAndFolders.map(f => {
                                return BaselineSiteJoin.PREFIX(f);
                            }))
                            .concat(self.project.customizableFilesAndFolders.map(f => {
                                return `!${path.join(config.folder.custom, f)}`
                            }))
                    ) : []
                )).concat( // common files for all project
                    self.project.isCoreProject ? [] : self.commonFilesForAllProjects
                ).concat( // core files of projects types
                    self.project.isCoreProject ? [] : self.project.projectSpecyficFiles()
                )
                // console.log(`self.project.isCoreProject for "${self.project.name}" = ${self.project.isCoreProject}`)
                // console.log(`self.project.isSite for ${path.basename(path.dirname(self.project.location))} "${self.project.name}" = ${self.project.isSite}  `)
                // console.log('ignoref iles', gitignoreFiles)
                return gitignoreFiles;
            },
            get npmignore() {
                const allowedProject: LibType[] = ['isomorphic-lib', 'angular-lib']
                const canBeUseAsNpmPackage = allowedProject.includes(self.project.type);
                const npmignoreFiles = [
                    ".vscode",
                    "dist/",
                    'src/',
                    "/scripts",
                    "/docs",
                    "/preview",
                    '/tests',
                    "tsconfig.json",
                    "npm-debug.log*"
                ].concat(self.commonFilesForAllProjects)

                return npmignoreFiles;
            }
        }
    }

    get vscode() {
        const self = this;
        return {
            get settings() {
                return {
                    excludedFiles() {
                        const pathSettingsVScode = path.join(self.project.location, '.vscode', 'settings.json')
                        if (fs.existsSync(pathSettingsVScode)) {
                            try {
                                const settings: VSCodeSettings = JSON5.parse(fs.readFileSync(pathSettingsVScode, 'utf8'))
                                settings["files.exclude"] = {};
                                self.filesIgnoredBy.vscodeSidebarFilesView.map(f => {
                                    settings["files.exclude"][f] = true
                                })
                                fs.writeFileSync(pathSettingsVScode, JSON.stringify(settings, null, 2), 'utf8')
                            } catch (e) {
                                console.log(e)
                            }
                        }
                    }
                }
            }
        }



    }

    customFolder() {
        if (this.project.baseline) {
            const customFolder = path.join(this.project.location, config.folder.custom)
            if (!fs.existsSync(customFolder)) {
                this.project.run(`tnp mkdirp ${config.folder.custom}`).sync()
            }
        }
    }


    npmignore() {
        fs.writeFileSync(path.join(this.project.location, '.npmignore'),
            this.filesIgnoredBy.npmignore.join('\n').concat('\n'), 'utf8');
    }

    gitignore() {
        fs.writeFileSync(path.join(this.project.location, '.gitignore'),
            this.filesIgnoredBy.gitignore.join('\n').concat('\n'), 'utf8');
    }

    projectSpecyficFiles() {
        const defaultProjectProptotype = Project.by(this.project.type);
        let files: RecreateFile[] = [];
        if (this.project.location !== defaultProjectProptotype.location) {
            this.project.projectSpecyficFiles().forEach(f => {
                files.push({
                    from: path.join(defaultProjectProptotype.location, f),
                    where: path.join(this.project.location, f)
                })
            })
            files.forEach(file => {
                copyFile(file.from, file.where)
            })
        }
    }

    commonFiles() {
        const wokrspace = Project.by('workspace');
        const files = this.commonFilesForAllProjects;
        files.map(file => {
            return {
                from: path.join(wokrspace.location, file),
                where: path.join(this.project.location, file)
            }
        }).forEach(file => {
            copyFile(file.from, file.where)
        })
    }


}