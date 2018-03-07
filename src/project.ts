
import * as Filehound from 'filehound';
import * as fs from 'fs';
import * as fse from "fs-extra";
import * as os from 'os';
import chalk from 'chalk';
import * as path from 'path';
import * as _ from 'lodash';
import { buildIsomorphic } from "morphi";
import { ChildProcess } from "child_process";

import { PackageJSON } from "./package-json";
import { LibType, BuildOptions, RecreateFile, Dependencies, BuildDir, RunOptions, RuleDependency } from "./models";
import { error, info, warn } from "./messages";
import config from "./config";
import { run as __run, watcher as __watcher } from "./process";
import { create } from 'domain';
import { copyFile, deleteFiles, copyFiles, getWebpackEnv, ReorganizeArray, ClassHelper } from "./helpers";
import { HelpersLinks } from "./helpers-links";
import { ProjectRouter } from './router';

//#region Project BASE
export abstract class Project {
    children: Project[] = [];
    dependencies: Project[] = [];
    parent: Project;
    preview: Project;
    type: LibType;
    private packageJson: PackageJSON;
    private static projects: Project[] = [];
    public static get Current() {
        return Project.from(process.cwd())
    }
    public static get Tnp() {
        return Project.from(path.join(__dirname, '..'));
    }

    protected abstract defaultPort: number;
    protected currentPort: number;

    public get activePort(): number | null {
        if (!this.isRunning) return null;
        return this.currentPort;
    }

    // get BasePort() {
    //     return this.defaultPort;
    // }

    protected isRunning = false;
    start(port?: number, async?: boolean) {
        console.log(`Project: ${this.name} is running ${async ? '(asynchronously)' : ''} on port ${port ? + port : this.defaultPort}`);
        this.isRunning = true;
        this.runOn(port, async)
    }

    protected abstract runOn(port?: number, async?: boolean);

    protected run(command: string, options?: RunOptions) {
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

    protected abstract get removeBeforeBuild(): string[];

    get routes() {
        return this.packageJson.routes;
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


    //#region node_modules
    get node_modules() {
        const self = this;
        return {
            linkToProject(project: Project, force = false) {
                if (!self.packageJson.checkNodeModulesInstalled()) {
                    self.packageJson.installNodeModules()
                }
                const localNodeModules = path.join(self.location, 'node_modules');
                const projectNodeModules = path.join(project.location, 'node_modules');
                if (force && fs.existsSync(projectNodeModules)) {
                    self.run(`tnp rimraf ${projectNodeModules}`);
                }
                const linkCommand = `tnp ln ${localNodeModules} ${project.location}`;
                self.run(linkCommand).sync();
            },
            install() {
                self.packageJson.installNodeModules()
            },
            installPackageFromNPM(packagePath) {
                self.packageJson.installPackage(packagePath, '--save');
            },
            get childrensLibsAsNpmPackages(): Project[] {
                const childrens = []
                if (!_.isArray(self.children) || self.children.length === 0) return childrens;
                const projectsForNodeModules: LibType[] = [
                    'server-lib',
                    'isomorphic-lib',
                    'angular-lib'
                ]
                self.children.forEach(c => {
                    if (path.basename(c.location) != c.name) {
                        error(`Project "${c.location}" has different packaage.json name property than his own folder name "${path.basename(c.location)}"`)
                    }
                })
                return self.children.filter(c => projectsForNodeModules.includes(c.type)).concat(childrens)
            },
            get localChildrens() {
                return {
                    removeSymlinks() {
                        const symlinks = self.node_modules.childrensLibsAsNpmPackages;
                        symlinks.forEach(c => {
                            const symPkgPath = path.join(self.location, 'node_modules', c.name);
                            if (fs.existsSync(symPkgPath)) {
                                self.run(`rm ${symPkgPath}`).sync();
                            }
                        })
                    },
                    addSymlinks() {
                        const symlinks = self.node_modules.childrensLibsAsNpmPackages;
                        symlinks.forEach(c => {
                            const destination = path.join(self.location, 'node_modules');
                            const command = `tnp ln ${c.location} ${destination}`;
                            self.run(command).sync();
                        })
                    },
                }
            },
            exist(): boolean {
                return self.packageJson.checkNodeModulesInstalled();
            },
            isSymbolicLink(): boolean {
                return HelpersLinks.isLink(self.node_modules.pathFolder);
            },
            get pathFolder() {
                return path.join(self.location, 'node_modules');
            },
            remove() {
                // console.log('remove node_modules', self.location)
                self.run('tnp rimraf node_modules').sync()
            }
        };
    }


    //#endregion

    //#region release
    release(prod = false) {
        this.bundleResources();
        const releseFilePath = path.join(
            __dirname, '..', 'templates',
            prod ? 'release-it-prod.json' : 'release-it.json');
        this.run(`tnp release-it -c ${releseFilePath}`).sync()
    }

    bundleResources() {
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
        info(`Resouces copied to release folde: ${config.folder.bundle}`)
    }
    //#endregion

    //#region build
    abstract buildSteps(buildOptions?: BuildOptions);

    build(buildOptions?: BuildOptions) {
        const { prod, watch, outDir } = buildOptions;

        this.filesRecreation.beforeBuild.commonFiles()
        this.filesRecreation.beforeBuild.projectSpecyficFiles()

        if (this.parent && this.parent.type === 'workspace') {
            if (!this.node_modules.exist()) {
                this.parent.node_modules.linkToProject(this);
            } else if (!this.node_modules.isSymbolicLink()) {
                this.run(`tnp rimraf ${this.node_modules.pathFolder}`).sync();
                this.parent.node_modules.linkToProject(this);
            }
        } else {
            this.node_modules.install();
        }

        if (_.isArray(this.removeBeforeBuild)) {
            this.removeBeforeBuild.forEach(f => {
                this.run(`tnp rimraf ${f}`).sync()
            })
        }

        this.buildSteps(buildOptions);
    }
    //#endregion

    //#region files recreatetion
    abstract projectSpecyficFiles(): string[];

    get filesRecreation() {
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
                            '.gitignore',
                            '.npmignore',
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
            return Project.from(path.join(__dirname, `../projects/workspace`));
        }
        projectPath = path.join(__dirname, `../projects/workspace/${libraryType}`);
        if (!fs.existsSync(projectPath)) {
            error(`Bad library type: ${libraryType}`, true)
            return undefined;
        }
        return Project.from(projectPath);
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
                return Project.from(dir);
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
        const project = Project.from(destinationPath);
        console.log(chalk.green('Done.'));
        return project;
    }

    static from(location: string, parent?: Project): Project {

        const alreadyExist = Project.projects.find(l => l.location.trim() === location.trim());
        if (alreadyExist) return alreadyExist;
        if (!fs.existsSync(location)) return;
        if (!PackageJSON.from(location)) return;
        const type = Project.typeFrom(location);
        if (type === 'isomorphic-lib') return new ProjectIsomorphicLib(location);
        if (type === 'angular-lib') return new ProjectAngularLib(location);
        if (type === 'angular-client') return new ProjectAngularClient(location);
        if (type === 'workspace') return new ProjectWorkspace(location);
        if (type === 'docker') return new ProjectDocker(location);
        if (type === 'server-lib') return new ProjectServerLib(location);
        if (type === 'angular-cli') return new ProjectAngularCliClient(location);
        if (type === 'ionic-client') return new ProjectIonicClient(location);
    }

    private static typeFrom(location: string): LibType {
        const packageJson = PackageJSON.from(location);
        let type = packageJson.type;
        return type;
    }

    constructor(public location: string) {
        if (fs.existsSync(location)) {

            this.packageJson = PackageJSON.from(location);
            this.type = this.packageJson.type;
            Project.projects.push(this);
            // console.log(`Created project ${path.basename(this.location)}`)

            this.children = this.findChildren();
            this.parent = Project.from(path.join(location, '..'));
            this.dependencies = this.packageJson.requiredProjects;
            this.preview = Project.from(path.join(location, 'preview'));

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

    get resources(): string[] {
        return this.packageJson.resources;
    }
    //#endregion

};
//#endregion


//#region Workspace
export class ProjectWorkspace extends Project {

    protected removeBeforeBuild: string[] = [];
    protected defaultPort: number = 5000;

    runOn(port: number, async = false) {
        if (!port) port = this.defaultPort;
        this.currentPort = port;
        // let childPort = port;
        // this.children.forEach(p => {
        //     p.start(++childPort, true);
        // })

        new ProjectRouter(this);

        // ROUTER IMPLEMENTATION
    }
    projectSpecyficFiles(): string[] {
        return [];
    }

    buildSteps(buildOptions?: BuildOptions) {
        console.log('Projects to build:')
        this.children.forEach((project, i) => {
            console.log(`${i + 1}. ${project.name}`)
        })
        console.log('===================')
        const projects = {
            serverLibs: [],
            isomorphicLibs: [],
            angularLibs: [],
            angularClients: [],
            angularCliClients: [],
            dockers: []
        };
        this.children.forEach(project => {
            if (project.type === 'docker') projects.dockers.push(project);
            else if (project.type === 'server-lib') projects.serverLibs.push(project);
            else if (project.type === 'isomorphic-lib') projects.isomorphicLibs.push(project);
            else if (project.type === 'angular-lib') projects.angularLibs.push(project);
            else if (project.type === 'angular-client') projects.angularClients.push(project);
            else if (project.type === 'angular-cli') projects.angularCliClients.push(project);
        })


        _.keys(projects).forEach((key) => {
            let libsProjects = (projects[key] as Project[]);

            function order(): boolean {
                let everthingOk = true;
                libsProjects.some(p => {
                    const indexProject = _.indexOf(libsProjects, p);
                    p.dependencies.some(pDep => {
                        const indexDependency = _.indexOf(libsProjects, pDep);
                        if (indexDependency > indexProject) {
                            libsProjects = ReorganizeArray(libsProjects).moveElement(pDep).before(p);
                            everthingOk = false;
                            return !everthingOk;
                        }
                    });
                    return !everthingOk;
                });
                return everthingOk;
            }

            let cout = 0
            while (!order()) {
                console.log(`Sort(${++cout})`, libsProjects);
            }
        });


        process.exit(0)
        const projectsInOrder: Project[] = [
            ...projects.serverLibs,
            ...projects.isomorphicLibs,
            ...projects.angularLibs,
            ...projects.angularClients,
            ...projects.angularCliClients
        ];

        projectsInOrder.forEach((project, i) => {
            console.log(`${i + 1}. project: ${project.name}`)
            // project.build({
            //     project,
            //     prod,
            //     watch,
            //     outDir
            // });
        })
        return;
    }
}
//#endregion


//#region Server Lib
export class ProjectServerLib extends Project {

    protected removeBeforeBuild: string[];
    protected defaultPort: number = 4050;
    runOn(port: number, async = false) {
        if (!port) port = this.defaultPort;
        this.currentPort = port;
        const command = `node dist/run.js -p ${port} -s`;
        const options = {};
        if (async) {
            this.run(command, options).async()
        } else {
            this.run(command, options).sync()
        }
    }

    projectSpecyficFiles(): string[] {
        return [];
    }

    buildSteps(buildOptions?: BuildOptions) {
        const { prod, watch, outDir } = buildOptions;
        this.run(`tnp npm-run tsc ${watch ? '-w' : ''} --outDir ${outDir}`).sync()
    }
}
//#endregion


//#region Isomorphic lib
export class ProjectIsomorphicLib extends Project {

    protected removeBeforeBuild: string[] = ['src/client.ts', 'src/browser.ts'];
    protected defaultPort: number = 4000;
    runOn(port: number, async = false) {
        if (!port) port = this.defaultPort;
        this.currentPort = port;
        const command = `node dist/run.js -p ${port}`;
        const options = {};
        if (async) {
            this.run(command, options).async()
        } else {
            this.run(command, options).sync()
        }
    }

    projectSpecyficFiles(): string[] {
        return [
            'index.js',
            'index.d.ts',
            'index.js.map',
            "tsconfig.json",
            "tsconfig.browser.json"
        ];
    }

    buildSteps(buildOptions?: BuildOptions) {
        const { prod, watch, outDir } = buildOptions;
        const webpackParams = BuildOptions.stringify(prod, watch, outDir);
        if (watch) {
            const functionName = ClassHelper.getMethodName(
                ProjectIsomorphicLib.prototype,
                ProjectIsomorphicLib.prototype.BUILD_ISOMORPHIC_LIB_WEBPACK)

            this.watcher.call(functionName, webpackParams);
        } else {
            this.BUILD_ISOMORPHIC_LIB_WEBPACK(webpackParams);
        }
        return;
    }

    BUILD_ISOMORPHIC_LIB_WEBPACK(params: string) {

        const env = getWebpackEnv(params);

        buildIsomorphic({
            foldersPathes: {
                dist: env.outDir
            },
            toolsPathes: {
                tsc: 'tnp tsc',
                cpr: 'tnp cpr',
                rimraf: 'tnp rimraf',
                mkdirp: 'tnp mkdir'
            }
        });
    }

}

//#endregion


//#region Docker
export class ProjectDocker extends Project {

    protected removeBeforeBuild: string[];
    protected defaultPort: number;
    runOn(port: number, async = false) {
        if (!port) port = this.defaultPort;
        this.currentPort = port;
    }

    projectSpecyficFiles(): string[] {
        return [

        ];
    }

    buildSteps(buildOptions?: BuildOptions) {
        const { prod, watch, outDir } = buildOptions;

    }
}
//#endregion


//#region Angular Lib
export class ProjectAngularLib extends Project {



    protected removeBeforeBuild: string[];
    protected defaultPort: number = 4100;
    runOn(port: number, async = false) {
        if (!port) port = this.defaultPort;
        this.currentPort = port;
        const command = `tnp http-server -p ${port} -s`;
        const options = { cwd: path.join(this.location, config.folder.previewDistApp) };
        if (async) {
            this.run(command, options).async()
        } else {
            this.run(command, options).sync()
        }
    }

    projectSpecyficFiles(): string[] {
        return [
            ...ProjectAngularCliClient.DEFAULT_FILES,
            'index.js',
            'index.d.ts',
            'index.js.map',
            'gulpfile.js',
            'ng-package.json',
            'tsconfig-aot.json'
        ];
    }

    buildSteps(buildOptions?: BuildOptions) {
        const { prod, watch, outDir } = buildOptions;
        if (watch) {
            this.run('tnp npm-run ng server').async()
            this.watcher.run('npm run build:esm', 'components/src');
        } else {
            this.run(`npm run build:esm`).sync();
            this.run(`npm run build`).sync();
        }
    }
}
//#endregion


//#region Angular Client
export class ProjectAngularClient extends Project {

    protected removeBeforeBuild: string[];
    protected defaultPort: number = 4300;
    runOn(port: number, async = false) {
        if (!port) port = this.defaultPort;
        this.currentPort = port;
        const command = `tnp http-server -p ${port} -s`;
        const options = { cwd: path.join(this.location, config.folder.previewDistApp) };
        if (async) {
            this.run(command, options).async()
        } else {
            this.run(command, options).sync()
        }
    }

    projectSpecyficFiles(): string[] {
        return [
            ...ProjectAngularCliClient.DEFAULT_FILES,
            'index.js',
            'index.d.ts',
            'index.js.map',
            'webpack.config.build.aot.js',
            'webpack.config.build.js',
            'webpack.config.common.js',
            'webpack.config.js'
        ];
    }
    buildSteps(buildOptions?: BuildOptions) {
        const { prod, watch, outDir } = buildOptions;
        if (watch) {
            this.run(`tnp npm-run webpack-dev-server --port=${4201}`).sync()
        } else {
            if (prod) {
                this.run(`npm run build:aot`).sync()
            } else {
                this.run(`npm run build`).sync()
            }
        }
    }
}
//#endregion


//#region AngularCliClient
export class ProjectAngularCliClient extends Project {

    protected removeBeforeBuild: string[];
    protected defaultPort: number = 4200;
    runOn(port: number, async = false) {
        if (!port) port = this.defaultPort;
        this.currentPort = port;
        const command = `tnp http-server -p ${port} -s`;
        const options = { cwd: path.join(this.location, config.folder.previewDistApp) };
        if (async) {
            this.run(command, options).async()
        } else {
            this.run(command, options).sync()
        }
    }

    public static DEFAULT_FILES = [
        "tsconfig.json",
        'src/tsconfig.app.json',
        'src/tsconfig.spec.json',
        'protractor.conf.js',
        'karma.conf.js'
    ]

    projectSpecyficFiles(): string[] {
        return ProjectAngularCliClient.DEFAULT_FILES;
    }

    buildSteps(buildOptions?: BuildOptions) {
        const { prod, watch, outDir } = buildOptions;
        if (watch) {
            this.run('npm-run ng serve').async()
        } else {
            this.run(`npm-run ng build --output-path ${config.folder.previewDistApp}`).sync()
        }
    }

}
//#endregion


//#region Ionic Client
export class ProjectIonicClient extends Project {



    protected removeBeforeBuild: string[];
    protected defaultPort: number = 8100;
    runOn(port: number, async = false) {
        if (!port) port = this.defaultPort;
        this.currentPort = port;
        const command = `tnp npm-run ionic serve --no-open -p ${port} -s`;
        const options = { cwd: path.join(this.location, config.folder.previewDistApp) };
        if (async) {
            this.run(command, options).async()
        } else {
            this.run(command, options).sync()
        }
    }

    projectSpecyficFiles(): string[] {
        return [
            'index.js',
            'index.d.ts',
            'index.js.map',
            'tsconfig.json'
        ];
    }

    buildSteps(buildOptions?: BuildOptions) {
        const { prod, watch, outDir } = buildOptions;
        if (watch) {
            this.run(`tnp npm-run ionic serve --no-open -p ${this.defaultPort}`).async()
        } else {
            this.run(`tnp npm-run ionic-app-scripts build ${prod ? '--prod' : ''}`).sync();
        }
    }
}
//#endregion