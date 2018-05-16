

import * as fs from 'fs';
import * as fse from "fs-extra";
import chalk from 'chalk';
import * as path from 'path';
import * as _ from 'lodash';
export { ChildProcess } from 'child_process';
import { ChildProcess } from "child_process";
// local 
import { PackageJSON } from "./package-json";
import { LibType, BuildOptions, RecreateFile, RunOptions, Package, BuildDir, EnvConfig } from "../models";
import { error, info, warn } from "../messages";
import config from "../config";
import { run as __run, watcher as __watcher } from "../process";
import { copyFile } from "../helpers";
import { BaseProjectRouter } from './base-project-router';
import { ProjectFrom } from './index';
import { NodeModules } from "./node-modules";
import { FilesRecreator } from './files-builder';
import { workers } from 'cluster';
import { init } from '../scripts/INIT';
import { HelpersLinks } from '../helpers-links';


export abstract class Project extends BaseProjectRouter {
    abstract projectSpecyficFiles(): string[];
    abstract buildSteps(buildOptions?: BuildOptions);


    readonly children: Project[] = [];
    readonly requiredLibs: Project[] = [];
    readonly parent: Project;
    readonly preview: Project;
    readonly baseline: Project;
    readonly type: LibType;
    readonly packageJson: PackageJSON;
    readonly node_modules: NodeModules;
    readonly recreate: FilesRecreator;


    static projects: Project[] = [];

    static get Current() {
        const current = ProjectFrom(process.cwd())
        if (!current) {
            error(`Current location is not a ${chalk.bold('tnp')} type project.\n\n${process.cwd()}`)
        }
        return current;
    }
    static get Tnp() {
        return ProjectFrom(path.join(__dirname, '..', '..'));
    }


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

    get isSite() {
        const customExist = fs.existsSync(path.join(this.location, config.folder.custom));
        const res = (this.baseline && customExist);
        // if (res === undefined) {
        //     console.log('customExist', customExist)
        //     if (!_.isObject(this.baseline)) {
        //         console.log(`baseline not object but ${typeof this.baseline} for ${this.location} `, )
        //     }
        //     console.log(Project.projects.map(p => {
        //         return `${path.basename(path.dirname(p.location))} "${p.name}" baseline = ${typeof p.baseline} `
        //     }))
        //     process.exit(0)
        // }
        return res;
    }

    get isCoreProject() {
        return this.packageJson.isCoreProject;
    }

    requiredDependencies(): Package[] {
        return [
            { name: "node-sass", version: "^4.7.2" },
            { name: "typescript", version: "2.6.2" }
        ]
    }

    defaultPortByType(): number {
        const type: LibType = this.type;
        if (type === 'workspace') return 5000;
        if (type === 'angular-cli') return 4200;
        if (type === 'angular-client') return 4300;
        if (type === 'angular-lib') return 4250;
        if (type === 'ionic-client') return 8080;
        if (type === 'docker') return 5000;
        if (type === 'isomorphic-lib') return 4000;
        if (type === 'server-lib') return 4050;
    }

    constructor(public location: string) {
        super();

        if (fs.existsSync(location)) {

            // console.log('PROJECT FROM', location)

            this.packageJson = PackageJSON.from(location);
            this.node_modules = new NodeModules(this);
            this.recreate = new FilesRecreator(this);
            this.type = this.packageJson.type;
            this.defaultPort = this.defaultPortByType()
            Project.projects.push(this);
            if (Project.Current.location === this.location) {
                if (this.parent && this.parent.type === 'workspace') {
                    this.parent.tnpHelper.install()
                }
                this.tnpHelper.install()
            }

            // console.log(`Created project ${path.basename(this.location)}`)

            this.children = this.findChildren();
            this.parent = ProjectFrom(path.join(location, '..'));
            this.requiredLibs = this.packageJson.requiredProjects;
            this.preview = ProjectFrom(path.join(location, 'preview'));

            if (!this.isCoreProject) {
                if (this.baseline && this.type !== 'workspace') {
                    error(`Baseline is only for ${chalk.bold('workspace')} type projects.`);
                } else if (this.parent && this.parent.type === 'workspace' && this.parent.baseline) {
                    this.baseline = ProjectFrom(path.join(this.parent.baseline.location, this.name))
                } else {
                    this.baseline = this.packageJson.basedOn;
                }
                // if (!!this.baseline) {
                //     console.log(`Baseline resolved from ${location}`)
                // } else {
                //     console.log(`Baseline NOT resolved from ${location}`)
                // }
            }

            if (this.parent && this.parent.type === 'workspace') {
                let pathToWorkspaceProjectEnvironment = path.join(this.parent.location, 'environment');
                if (fs.existsSync(`${pathToWorkspaceProjectEnvironment}.js`)) {
                    // console.log('path to search for envrionment', path.join(this.parent.location, 'environment'))
                    const env: EnvConfig = require(pathToWorkspaceProjectEnvironment) as any;

                    if (Array.isArray(env.routes)) {
                        this.routes = env.routes;
                    }

                    const route = env.routes.find(r => r.project === this.name);
                    if (route) {
                        // console.log('route', route)
                        this.defaultPort = route.localEnvPort;
                        // console.log('new default port', this.defaultPort)
                    } else {
                        // console.log(`No route default port for ${this.name} in ${this.location}`)
                    }
                }
            }

        } else {
            error(`Invalid project location: ${location}`);
        }
    }


    get customizableFilesAndFolders() {
        if (this.type === 'workspace') return [
            'environment.d.ts',
            'environment.js',
            'environment.dev.js',
            'environment.prod.js',
            'environment.stage.js'
        ]
        const files: string[] = ['src']
        if (this.type === 'angular-lib') files.push('components');
        return files;
    }


    run(command: string, options?: RunOptions) {
        if (!options) options = {}
        if (!options.cwd) options.cwd = this.location;
        return __run(command, options);
    }

    protected get watcher() {
        const self = this;
        return {
            run(command: string, folderPath: string = 'src', wait?: number) {
                const cwd: string = self.location;
                return __watcher.run(command, folderPath, { cwd, wait });
            },
            call(fn: Function | string, params: string, folderPath: string = 'src') {
                const cwd: string = self.location;
                return __watcher.call(fn, params, folderPath, { cwd });
            }
        }
    }



    protected buildOptions?: BuildOptions;
    build(buildOptions?: BuildOptions) {
        const { prod, watch, outDir } = buildOptions;
        this.buildOptions = buildOptions;

        init();

        this.node_modules.prepare();

        this.buildSteps(buildOptions);
    }

    public clear(includeNodeModules = false) {
        const gitginoredfiles = this.recreate.filesIgnoredBy.gitignore
            .filter(f => {
                if (f === config.folder.node_modules) {
                    return includeNodeModules;
                }
                return true;
            }) // link/unlink takes care of node_modules
            .join(' ');
        // console.log(this.recreate.filesIgnoredBy.gitignore.join('\n'))
        this.run(`tnp rimraf ${gitginoredfiles}`).sync();
    }

    public static by(libraryType: LibType): Project {
        // console.log('by libraryType ' + libraryType)
        let projectPath;
        if (libraryType === 'workspace') {
            return ProjectFrom(path.join(__dirname, `../../projects/workspace`));
        }
        projectPath = path.join(__dirname, `../../projects/workspace/${libraryType}`);
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
            'e2e', 'tmp.*', 'dist.*', 'tests', 'module', 'browser', 'bundle*',
            'components', '\.git', 'bin', 'custom'
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
        const options: fse.CopyOptionsSync = {
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

    public checkIfReadyForNpm() {
        // console.log('TYPEEEEE', this.type)
        const libs: LibType[] = ['angular-lib', 'isomorphic-lib'];
        if (!libs.includes(this.type)) {
            error(`This project "${chalk.bold(this.name)}" isn't library type project (${libs.join(', ')}).`)
        }
        return true;
    }

    public get tnpHelper() {
        const helperName = 'tnp-helpers'
        const pathTnpHelper = path.join(Project.Tnp.location, 'projects', helperName);
        const self = this;
        return {
            install() {
                let project: Project;
                if (self.parent && self.parent.type === 'workspace') {
                    project = self.parent;
                } else {
                    project = self;
                }

                const dest = path.join(project.location, config.folder.node_modules, helperName)
                if (fs.existsSync(dest)) {
                    // console.log(`Removed tnp-helper from ${dest} `)
                    fse.removeSync(dest)
                }
                fse.copySync(`${pathTnpHelper}/`, dest);
                // console.log(`Tnp-helper installed in ${project.name} `)
            }
        }
    }


    // TODO solve problem with ngc watch mode high cpu
    // get ownNpmPackage() {
    //     const self = this;
    //     return {
    //         linkTo(project: Project) {
    //             const targetLocation = path.join(project.location, 'node_modules', self.name)
    //             // project.run(`tnp rimraf ${targetLocation}`).sync();
    //             Project.Tnp.run(`tnp ln ./ ${targetLocation}`).sync()
    //         },
    //         unlinkFrom(project: Project) {
    //             const targetLocation = path.join(project.location, 'node_modules', self.name)
    //             project.run(`tnp rimraf ${targetLocation}`).sync();
    //         }
    //     };
    // }

};
