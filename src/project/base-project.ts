

import * as fs from 'fs';
import * as fse from "fs-extra";
import chalk from 'chalk';
import * as path from 'path';
import * as _ from 'lodash';
export { ChildProcess } from 'child_process';
import { ChildProcess } from "child_process";
// local 
import { PackageJSON } from "./package-json";
import { LibType, BuildOptions, RecreateFile, RunOptions } from "../models";
import { error, info, warn } from "../messages";
import config from "../config";
import { run as __run, watcher as __watcher } from "../process";
import { copyFile } from "../helpers";
import { BaseProjectRouter } from './base-project-router';
import { ProjectFrom } from './index';
import { NodeModules } from "./node-modules";
import { FilesRecreator } from './files-builder';
import { workers } from 'cluster';


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
        return ProjectFrom(process.cwd())
    }
    static get Tnp() {
        return ProjectFrom(path.join(__dirname, '..', '..'));
    }

    get routes() {
        return this.packageJson.routes;
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
        return this.baseline && fs.existsSync(path.join(this.location, 'custom'));
    }

    get isCoreProject() {
        return this.packageJson.isCoreProject;
    }

    constructor(public location: string) {
        super();

        if (fs.existsSync(location)) {

            // console.log('PROJECT FROM', location)

            this.packageJson = PackageJSON.from(location);
            this.node_modules = new NodeModules(this);
            this.recreate = new FilesRecreator(this);
            this.type = this.packageJson.type;
            Project.projects.push(this);
            // console.log(`Created project ${path.basename(this.location)}`)

            this.children = this.findChildren();
            this.parent = ProjectFrom(path.join(location, '..'));
            this.requiredLibs = this.packageJson.requiredProjects;
            this.preview = ProjectFrom(path.join(location, 'preview'));

            if (this.baseline && this.type !== 'workspace') {
                error(`Baseline is only for ${chalk.bold('workspace')} type projects.`);
            } else if (this.parent && this.parent.type === 'workspace' && this.parent.baseline) {
                this.baseline = ProjectFrom(path.join(this.parent.baseline.location, this.name))
            } else {
                this.baseline = this.packageJson.basedOn;
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

    build(buildOptions?: BuildOptions) {
        const { prod, watch, outDir } = buildOptions;

        this.recreate.gitignore()
        this.recreate.npmignore()
        this.recreate.projectSpecyficFiles()
        this.recreate.commonFiles()

        this.node_modules.prepare();

        this.buildSteps(buildOptions);
    }

    public clear(all = false) {
        const gitginoredfiles = this.recreate.filesIgnoredBy.gitignore
            .filter(f => !(all && f === config.folder.node_modules)) // link/unlink takes care of node_modules
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

};
