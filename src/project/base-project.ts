

import * as fs from 'fs';
import * as fse from "fs-extra";
import chalk from 'chalk';
import * as path from 'path';
import * as _ from 'lodash';
export { ChildProcess } from 'child_process';
import { ChildProcess } from "child_process";

import { PackageJSON } from "./package-json";
import {
    LibType, BuildOptions, RecreateFile,
    RunOptions
} from "../models";
import { error, info, warn } from "../messages";
import config from "../config";
import {
    run as __run, watcher as __watcher
} from "../process";

import {
    copyFile
} from "../helpers";
import { BaseProjectRouter } from './base-project-router';
import {
    ProjectFrom
} from './index';
import { NodeModules } from "./node-modules";


export abstract class Project extends BaseProjectRouter {
    children: Project[] = [];
    dependencies: Project[] = [];
    parent: Project;
    preview: Project;
    get baseline(): Project {
        return this.packageJson.basedOn;
    }

    get isSite() {
        return this.baseline && fs.existsSync(path.join(this.location, 'custom'));
    }

    type: LibType;
    public packageJson: PackageJSON;
    public node_modules: NodeModules;
    public static projects: Project[] = [];
    public static get Current() {
        return ProjectFrom(process.cwd())
    }
    public static get Tnp() {
        return ProjectFrom(path.join(__dirname, '..', '..'));
    }

    get routes() {
        return this.packageJson.routes;
    }


    //#region generated files



    public get generateFiles() {
        const self = this;
        return {
            npmignore() {
                const allowedProject: LibType[] = ['isomorphic-lib', 'angular-lib']
                const canBeUseAsNpmPackage = allowedProject.includes(self.type);
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
                ];
                fs.writeFileSync(path.join(self.location, '.npmignore'),
                    npmignoreFiles.join('\n'), 'utf8');
            },
            gitignore() {

                const gitignoreFiles = [ // for sure ingored
                    '/node_modules',
                    '/tmp*',
                    '/dist*',
                    '/bundle*',
                    '/browser',
                    '/module',
                    '/www',
                    'bundle.umd.js'
                ].concat([ // common small files
                    'Thumbs.db',
                    '.DS_Store',
                    'npm-debug.log'
                ].concat([ // not sure if ignored/needed
                    '/.sass-cache',
                    '/.sourcemaps'
                ]).concat( // dendend 
                    self.isSite ? ['/src'] : []
                ))
                fs.writeFileSync(path.join(self.location, '.gitignore'),
                    gitignoreFiles.join('\n'), 'utf8');
            }
        }
    }
    //#endregion

    run(command: string, options?: RunOptions) {
        if (!options) options = {}
        if (!options.cwd) options.cwd = this.location;
        return __run(command, options);
    }

    protected get watcher() {
        const self = this;
        return {
            run(command: string, folderPath: string = 'src') {
                const cwd: string = self.location;
                return __watcher.run(command, folderPath, cwd);
            },
            call(fn: Function | string, params: string, folderPath: string = 'src') {
                const cwd: string = self.location;
                return __watcher.call(fn, params, folderPath, cwd);
            }
        }
    }




    get ownNpmPackage() {
        const self = this;
        return {
            linkTo(project: Project) {
                const targetLocation = path.join(project.location, 'node_modules', self.name)
                // project.run(`tnp rimraf ${targetLocation}`).sync();
                Project.Tnp.run(`tnp ln ./ ${targetLocation}`).sync()
            },
            unlinkFrom(project: Project) {
                const targetLocation = path.join(project.location, 'node_modules', self.name)
                project.run(`tnp rimraf ${targetLocation}`).sync();
            }
        };
    }



    //#region build
    abstract buildSteps(buildOptions?: BuildOptions);

    build(buildOptions?: BuildOptions) {
        const { prod, watch, outDir } = buildOptions;

        this.filesRecreationFromBeforeBuild.beforeBuild.commonFiles()
        this.filesRecreationFromBeforeBuild.beforeBuild.projectSpecyficFiles()

        if (this.parent && this.parent.type === 'workspace') {
            if (!this.node_modules.exist()) {
                this.parent.node_modules.linkToProject(this);
            } else if (!this.node_modules.isSymbolicLink()) {
                this.run(`tnp rimraf ${this.node_modules.folderPath}`).sync();
                this.parent.node_modules.linkToProject(this);
            }
        } else {
            this.node_modules.installPackages();
        }

        this.buildSteps(buildOptions);
    }
    //#endregion

    //#region files recreatetion
    abstract projectSpecyficFiles(): string[];

    get filesRecreationFromBeforeBuild() {
        const self = this;
        return {
            get beforeBuild() {
                return {
                    projectSpecyficFiles() {
                        const defaultProjectProptotype = Project.by(self.type);
                        let files: RecreateFile[] = [];
                        if (self.location !== defaultProjectProptotype.location) {
                            self.projectSpecyficFiles().forEach(f => {
                                files.push({
                                    from: path.join(defaultProjectProptotype.location, f),
                                    where: path.join(self.location, f)
                                })
                            })
                            files.forEach(file => {
                                copyFile(file.from, file.where)
                            })
                        }
                    },
                    commonFiles() {
                        const wokrspace = Project.by('workspace');
                        let files = [
                            // '.npmrc',
                            'tslint.json',
                            '.editorconfig'
                        ];
                        files.map(file => {
                            return {
                                from: path.join(wokrspace.location, file),
                                where: path.join(self.location, file)
                            }
                        }).forEach(file => {
                            copyFile(file.from, file.where)
                        })
                    }
                };
            }
        }
    }
    //#endregion

    //#region get project 
    public static by(libraryType: LibType): Project {
        // console.log('by libraryType ' + libraryType)
        let projectPath;
        if (libraryType === 'workspace') {
            return ProjectFrom(path.join(__dirname, `../projects/workspace`));
        }
        projectPath = path.join(__dirname, `../projects/workspace/${libraryType}`);
        if (!fs.existsSync(projectPath)) {
            error(`Bad library type: ${libraryType}`, true)
            return undefined;
        }
        return ProjectFrom(projectPath);
    }

    public findChildren(): Project[] {
        // console.log('from ' + this.location)

        const notAllowed: RegExp[] = [
            '\.vscode', 'node\_modules',
            ..._.values(config.folder),
            'e2e', 'tmp.*', 'dist.*', 'tests',
            'components', '\.git', 'bin'
        ].map(s => new RegExp(s))

        const isDirectory = source => fse.lstatSync(source).isDirectory()
        const getDirectories = source =>
            fse.readdirSync(source).map(name => path.join(source, name)).filter(isDirectory)

        let subdirectories = getDirectories(this.location)
            .filter(f => {
                const folderNam = path.basename(f);
                return (notAllowed.filter(p => p.test(folderNam)).length === 0);
            })

        return subdirectories
            .map(dir => {
                // console.log('child:', dir)
                return ProjectFrom(dir);
            })
            .filter(c => !!c)
    }

    cloneTo(destinationPath: string): Project {
        const options: fse.CopyOptions = {
            overwrite: true,
            recursive: true,
            errorOnExist: true,
            filter: (src) => {
                return !/.*node_modules.*/g.test(src);
            }
        };
        fse.copySync(this.location, destinationPath, options);
        console.log(chalk.green(`${this.type.toUpperCase()} library structure created sucessfully, installing npm...`));
        const project = ProjectFrom(destinationPath);
        console.log(chalk.green('Done.'));
        return project;
    }



    constructor(public location: string) {
        super();
        if (fs.existsSync(location)) {

            this.packageJson = PackageJSON.from(location);
            this.node_modules = new NodeModules(this);
            this.type = this.packageJson.type;
            Project.projects.push(this);
            // console.log(`Created project ${path.basename(this.location)}`)

            this.children = this.findChildren();
            this.parent = ProjectFrom(path.join(location, '..'));
            this.dependencies = this.packageJson.requiredProjects;
            this.preview = ProjectFrom(path.join(location, 'preview'));

        } else {
            warn(`Invalid project location: ${location}`);
        }
    }
    //#endregion

    //#region getters
    get name(): string {
        return this.packageJson.name;
    }

    get version() {
        return this.packageJson.version;
    }

    get versionPatchedPlusOne() {
        const ver = this.version.split('.');
        if (ver.length > 0) {
            ver[ver.length - 1] = (parseInt(ver[ver.length - 1]) + 1).toString()
        }
        return ver.join('.')
    }

    get resources(): string[] {
        return this.packageJson.resources;
    }
    //#endregion

};
