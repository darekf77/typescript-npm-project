
import * as Filehound from 'filehound';
import * as fs from 'fs';
import * as fse from "fs-extra";
import chalk from 'chalk';
import * as path from 'path';
import * as _ from 'lodash';

import { PackageJSON } from "./package-json";
import { LibType, BuildOptions, RecreateFile, Dependencies, BuildDir, RunOptions, RuleDependency } from "./models";
import { error, info, warn } from "./messages";
import config from "./config";
import { run as __run, watcher as __watcher } from "./process";
import { create } from 'domain';
import { copyFile, deleteFiles, copyFiles, isSymbolicLink, getWebpackEnv, ReorganizeArray } from "./helpers";
import { IsomorphicRegions } from "./isomorphic";
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
            call(fn: Function, params: string, folderPath: string = 'src') {
                const cwd: string = self.location;
                return __watcher.call(fn, params, folderPath, cwd);
            }
        }
    }

    get routes() {
        return this.packageJson.routes;
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
                    this.run(`tnp rimraf ${projectNodeModules}`);
                }
                const linkCommand = `tnp ln ${localNodeModules} ${project.location}`;
                self.run(linkCommand).sync();
            },
            install() {
                self.packageJson.installNodeModules()
            },
            installPackageFromLocalPath(packagePath) {
                self.packageJson.installPackage(packagePath, '--save');
            },
            removeSymlinks(): string[] {
                const symlinks = self.packageJson.getSymlinksLocalDependenciesNames();
                // console.log(symlinks)
                symlinks.forEach(pkgName => {
                    const symPkgPath = path.join(self.location, 'node_modules', pkgName);
                    if (fs.existsSync(symPkgPath)) {
                        self.run(`rm ${symPkgPath}`).sync();
                    }
                })
                return symlinks;
            },
            addLocalSymlinksFromFileDependecies() {
                const symlinks = self.packageJson.getSymlinksLocalDependenciesPathes()
                symlinks.forEach(p => {
                    const absolutePkgPath = path.join(self.location, p);
                    const destination = path.join(self.location, 'node_modules');
                    self.run(`tnp ln ${absolutePkgPath} ${destination}`, { cwd: self.location }).sync();
                })
            },
            // addLocalSymlinksfromChildrens() {
            //     const children = self.children;
            //     children.forEach(child => {
            //         const childPackageFolder = path.join(child.location, 'node_modules', child.name);
            //         const node_modules = path.join(self.location, 'node_modules');
            //         if (!fs.existsSync(path.join(node_modules, child.name))) {
            //             run(`tnp ln ${childPackageFolder} ${node_modules}`).sync();
            //         }
            //     })
            // },
            exist(): boolean {
                return self.packageJson.checkNodeModulesInstalled();
            },
            isSymbolicLink(): boolean {
                return isSymbolicLink(self.node_modules.pathFolder);
            },
            get pathFolder() {
                return path.join(self.location, 'node_modules');
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
            fs.writeFileSync(dest, fs.readFileSync(file));
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
        const notAllowed: string[] = [
            '.vscode', 'node_modules',
            ..._.values(config.folder),
            'e2e', 'tmp', 'tests',
            'components', '.git', 'bin',
            '.'
        ]
        let subdirectories: string[] = Filehound.create()
            .path(this.location)
            .depth(1)
            .directory()
            .findSync()
        subdirectories = subdirectories
            .filter(f => !notAllowed.find(a => path.basename(f) == a));

        return subdirectories
            .map(dir => {
                // console.log('dir:', dir)
                return Project.from(dir);
            })
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
            this.watcher.call(BUILD_ISOMORPHIC_LIB_WEBPACK, webpackParams);
        } else {
            BUILD_ISOMORPHIC_LIB_WEBPACK.call(this, webpackParams)
        }
        return;
    }

    async createTemporaryBrowserSrc() {

        const src = path.join(this.location, config.folder.src);
        const tempSrc = path.join(this.location, config.folder.tempSrc);
        try {
            if (!fs.existsSync(tempSrc)) {
                fs.mkdirSync(tempSrc);
            }
            // else {
            //     await deleteFiles('./**/*.ts', {
            //         cwd: tempSrc,
            //         filesToOmmit: [path.join(tempSrc, 'index.ts')]
            //     })
            // }
            const files = await copyFiles('./**/*.ts', tempSrc, {
                cwd: src
            })
            files.forEach(f => {
                IsomorphicRegions.deleteFrom(path.join(tempSrc, f));
            })
        } catch (err) {
            error(err);
        }
    }

}

export function BUILD_ISOMORPHIC_LIB_WEBPACK(params: string) {
    const env = getWebpackEnv(params);
    //  --display-error-details to see more errors
    this.run(`tnp npm-run tsc --outDir ${env.outDir}`).sync();
    this.run(`tnp npm-run tnp create:temp:src`, { output: true }).sync();
    const browserOutDir = path.join('..', env.outDir, 'browser')
    const tempSrc = path.join(this.location, config.folder.tempSrc);

    const browserTemp = path.join(this.location, 'tsconfig.browser.json')
    const browserTsc = path.join(tempSrc, 'tsconfig.json')
    copyFile(browserTemp, browserTsc);
    const folders = fs.readdirSync(tempSrc)

    folders.forEach(f => {
        const file = path.join(tempSrc, f);
        // console.log('is dir -' + file + ' - :' + fs.lstatSync(file).isDirectory())
        if (f !== 'tsconfig.json' && f !== 'index.ts' && !fs.lstatSync(file).isDirectory()) {
            this.run(`tnp rimraf ${file}`).sync()
        }
    })
    this.run(`tnp npm-run tsc --outDir ${browserOutDir}`, { cwd: tempSrc }).sync();
    this.run(`tnp cpr ${path.join(this.location, env.outDir, 'browser')} browser -o`).sync();
}
//#endregion


//#region Docker
export class ProjectDocker extends Project {

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
        '.angular-cli.json',
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

