

export abstract class Project {
    children: Project[] = [];
    dependencies: Project[] = [];
    parent: Project;
    preview: Project;
    get baseline(): Project {
        return this.packageJson.basedOn;
    }

    get isSite() {
        return fs.existsSync(path.join(this.location, 'custom'));
    }

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

    protected isRunning = false;
    start(port?: number, async?: boolean) {
        console.log(`Project: ${this.name} is running ${async ? '(asynchronously)' : ''} on port ${port ? + port : this.defaultPort}`);
        this.isRunning = true;
        this.runOn(port, async)
    }

    protected abstract runOn(port?: number, async?: boolean);

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
                const isSiteFromBaselineProject = (fs.existsSync(path.join(self.location, config.folder.custom)));
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
                    isSiteFromBaselineProject ? ['/src'] : []
                ))
                fs.writeFileSync(path.join(self.location, '.gitignore'),
                    gitignoreFiles.join('\n'), 'utf8');
            }
        }
    }
    //#endregion

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
            get localChildrensWithRequiredLibs() {
                const symlinks = self.dependencies.concat(self.children);
                symlinks.forEach(c => {
                    if (path.basename(c.location) != c.name) {
                        error(`Project "${c.location}" has different packaage.json name property than his own folder name "${path.basename(c.location)}"`)
                    }
                })
                return {
                    removeSymlinks() {
                        symlinks.forEach(c => {
                            const symPkgPath = path.join(self.location, 'node_modules', c.name);
                            if (fs.existsSync(symPkgPath)) {
                                self.run(`rm ${symPkgPath}`).sync();
                            }
                        })
                    },
                    addSymlinks() {
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

    async publish() {
        await questionYesNo(`Publish on npm version: ${Project.Current.version} ?`, () => {
            this.run('npm publish', {
                cwd: path.join(this.location, config.folder.bundle),
                output: true
            }).sync()
        })
    }

    async release(prod = false) {
        const newVersion = Project.Current.versionPatchedPlusOne;
        await questionYesNo(`Release new version: ${newVersion} ?`, async () => {
            this.run(`npm version patch`).sync()
            this.run(`tnp clear:bundle`).sync();
            this.build({
                prod, outDir: config.folder.bundle as 'bundle'
            })
            this.bundleResources()
        }, () => process.exit(0))
        await questionYesNo(`Publish on npm version: ${newVersion} ?`, () => {
            this.run('npm publish', {
                cwd: path.join(this.location, config.folder.bundle),
                output: true
            }).sync()
        })
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
        info(`Resources copied to release folder: ${config.folder.bundle}`)
    }
    //#endregion

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
