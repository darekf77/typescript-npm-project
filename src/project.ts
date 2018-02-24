
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
import { copyFile, deleteFiles, copyFiles, isSymbolicLink, getWebpackEnv, checkRules } from "./helpers";
import { IsomorphicRegions } from "./isomorphic";

export class Project {
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

    //#region run on port
    runOn(port: number) {

        if (this.type === 'workspace') {



        }

    }

    //#endregion

    //#region link

    //#region  old linking
    // linkDependencies(type: Dependencies) {
    //     let self = this;
    //     const thisNodeModelsPath = path.join(this.location, 'node_modules');
    //     return {
    //         toProject(project: Project) {
    //             const dependencies = self.packageJson.dependencies(type);

    //             dependencies.some((d) => {
    //                 if (!fs.existsSync(path.join(thisNodeModelsPath, d.name))) {
    //                     self.packageJson.installNodeModules();
    //                     return false;
    //                 }
    //             });

    //             info(`Linking parent workspace common packages to ${project.name}...`)
    //             dependencies.forEach(d => {
    //                 const destinationFolder = path.join(project.location, 'node_modules', d.name);
    //                 const isOrganizationPackage = /.*\/.*/g.test(d.name);
    //                 const linkName2 = isOrganizationPackage ? d.name.split('/')[0] : '';
    //                 const destinationFolder2 = path.join(project.location, 'node_modules', linkName2);
    //                 const parentSourcePackagePath = path.join(thisNodeModelsPath, d.name);
    //                 const linkCommand = `tnp ln ${parentSourcePackagePath} .`;
    //                 run(`rimraf ${destinationFolder}`).sync()
    //                 run(`mkdirp  ${destinationFolder2}`).sync()
    //                 run(linkCommand, { cwd: destinationFolder2 }).sync()
    //             })
    //             info('Linking Done.')
    //         }
    //     }
    // }

    // linkParentDependencies() {
    //     if (this.parent && this.parent.type === 'workspace') {
    //         this.parent.linkDependencies('dependencies').toProject(this);
    //     }
    // }
    //#endregion

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
                    this.run(`rimraf ${projectNodeModules}`);
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
        this.run(`release-it -c ${releseFilePath}`).sync()
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
    private run(command: string, options?: RunOptions) {
        if (!options) options = {}
        if (!options.cwd) options.cwd = this.location;
        return __run(command, options);
    }

    private get watcher() {
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

    build(buildOptions?: BuildOptions) {
        const { prod, watch, outDir } = buildOptions;

        this.filesRecreation.commonFiles()
        this.filesRecreation.beforeBuild()

        if (this.parent && this.parent.type === 'workspace') {
            if (!this.node_modules.exist()) {
                this.parent.node_modules.linkToProject(this);
            } else if (!this.node_modules.isSymbolicLink()) {
                this.run(`rimraf ${this.node_modules.pathFolder}`).sync();
                this.parent.node_modules.linkToProject(this);
            }
        } else {
            this.node_modules.install();
        }

        switch (this.type) {

            //#region isomorphic-lib
            case 'isomorphic-lib':
                const webpackParams = BuildOptions.stringify(prod, watch, outDir);
                if (watch) {
                    this.watcher.call(BUILD_ISOMORPHIC_LIB_WEBPACK, webpackParams);
                } else {
                    BUILD_ISOMORPHIC_LIB_WEBPACK.call(this, webpackParams)
                }
                return;
            //#endregion 

            //#region nodejs-server
            case 'server-lib':
                this.run(`npm-run tsc ${watch ? '-w' : ''}`).sync()
                return
            //#endregion

            //#region angular-lib
            case 'angular-lib':
                if (watch) {
                    this.run('npm-run ng server').async()
                    this.watcher.run('npm run build:esm', 'components/src');
                } else {
                    this.run(`npm run build:esm`).sync();
                }
                return;
            //#endregion

            //#region angular-cli
            case 'angular-cli':
                if (watch) {
                    this.run('npm-run ng server').sync()
                }
                return;
            //#endregion

            //#region angular-client
            case 'angular-client':
                if (watch) {
                    this.run(`npm-run webpack-dev-server --port=${4201}`).sync()
                } else {
                    if (prod) {
                        this.run(`npm run build:aot`).sync()
                    } else {
                        this.run(`npm run build`).sync()
                    }
                }
                return;
            //#endregion

            //#region workspace
            case 'workspace':
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
                    const depRules: RuleDependency[] = [];
                    const libsProjects = (projects[key] as Project[]);
                    libsProjects.forEach(p => {
                        const indexProject = _.indexOf(libsProjects, p);
                        p.dependencies.forEach(pDep => {
                            const indexDependency = _.indexOf(libsProjects, pDep);
                            if (indexDependency > indexProject) {
                                depRules.push({
                                    dependencyLib: pDep,
                                    beforeProject: p
                                })
                            }
                        });
                    });

                    while (true) {
                        const shiftDeps = checkRules(depRules).forProjects(libsProjects)
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
            //#endregion 

        }
    }
    //#endregion

    //#region files recreatetion
    get filesRecreation() {
        const self = this;
        return {
            async createTemporaryBrowserSrc() {

                const src = path.join(self.location, config.folder.src);
                const tempSrc = path.join(self.location, config.folder.tempSrc);
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
            },
            beforeBuild() {
                const isomorphicLib = Project.by('isomorphic-lib');
                const files: RecreateFile[] = [];
                if (self.type === 'isomorphic-lib' && self.location !== isomorphicLib.location) {

                    files.push({
                        from: path.join(isomorphicLib.location, 'src', 'client.ts'),
                        where: path.join(self.location, 'src', 'client.ts')
                    })
                    files.push({
                        from: path.join(isomorphicLib.location, 'src', 'browser.ts'),
                        where: path.join(self.location, 'src', 'browser.ts')
                    })
                    const fileFromRoot = [
                        'index.js',
                        'index.d.ts',
                        'index.js.map',
                        'client.js',
                        'client.d.ts',
                        'client.js.map',
                        'browser.js',
                        'browser.d.ts',
                        'browser.js.map',
                        "tsconfig.json",
                        "tsconfig.browser.json"
                    ]
                    fileFromRoot.forEach(f => {
                        files.push({
                            from: path.join(isomorphicLib.location, f),
                            where: path.join(self.location, f)
                        })
                    })
                }
                files.forEach(file => {
                    copyFile(file.from, file.where)
                })
            },
            commonFiles() {
                const wokrspace = Project.by('workspace');
                let files = [
                    '.npmrc',
                    '.gitignore',
                    '.npmignore'
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
            error(`Bad library type: ${libraryType}`)
        }
        return Project.from(projectPath);
    }

    public findChildren(): Project[] {
        // console.log('from ' + this.location)
        const notAllowed: string[] = [
            '.vscode', 'node_modules', 'dist', 'bundle',
            'src', 'e2e', 'tmp', 'tests',
            'components', '.git', 'bin'
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
                return Project.from(dir);
            })
    }

    cloneTo(destinationPath: string): Project {
        const options: fse.CopyOptions = {
            overwrite: true,
            recursive: true,
            errorOnExist: true
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
        return new Project(location)
    }



    private constructor(public location: string) {
        if (fs.existsSync(location)) {

            this.packageJson = PackageJSON.from(location);
            this.type = this.packageJson.type;
            if (!this.type) {
                if (fs.existsSync(path.join(location, 'angular-cli.json'))) {
                    this.type = 'angular-cli';
                }
                error("Bad project type " + this.type)
            }
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


export function BUILD_ISOMORPHIC_LIB_WEBPACK(params: string) {
    const env = getWebpackEnv(params);
    //  --display-error-details to see more errors
    this.run(`npm-run tsc --outDir ${env.outDir}`).sync();
    this.run(`npm-run tnp create:temp:src`, { output: true }).sync();
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
            this.run(`rimraf ${file}`).sync()
        }
    })
    this.run(`npm-run tsc --outDir ${browserOutDir}`, { cwd: tempSrc }).sync();
    this.run(`cpr ${path.join(this.location, env.outDir, 'browser')} browser -o`).sync();
}
