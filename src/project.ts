
import * as Filehound from 'filehound';
import * as fs from 'fs';
import * as fse from "fs-extra";
import chalk from 'chalk';
import * as path from 'path';

import { PackageJSON } from "./package-json";
import { LibType, BuildOptions, RecreateFile, Dependencies } from "./models";
import { error, info, warn } from "./messages";
import config from "./config";
import { run, watcher } from "./process";

export class Project {
    children: Project[];
    parent: Project;
    preview: Project;
    type: LibType;
    private _packageJSON: PackageJSON;

    //#region link
    linkDependencies(type: Dependencies) {
        let self = this;
        const thisNodeModelsPath = path.join(this.location, 'node_modules');
        return {
            toProject(project: Project) {
                const dependencies = self._packageJSON.dependencies(type);
                dependencies.forEach(d => {
                    const destinationFolder = path.join(project.location, 'node_modules', d.name);
                    run(`rimraf ${destinationFolder}`)
                    run(`ln -s ${path.join(thisNodeModelsPath, d.name)} ${destinationFolder}`)
                })
            }
        }
    }

    linkParentDependencies() {
        if (this.parent && this.parent.type === 'workspace') {
            this.parent.linkDependencies('dependencies').toProject(this);
        }
    }
    //#endregion

    //#region release
    release(prod = false) {
        this.build
        this.bundleResources();
        const releseFilePath = path.join(
            __dirname, '..', 'templates',
            prod ? 'release-it-prod.json' : 'release-it.json');
        run(`release-it -c ${releseFilePath}`).sync()
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
    static BUILD_WATCH_ANGULAR_LIB() {
        console.log('Rebuilding start...')
        run(`npm run build:esm`, { folder: 'preview' }).sync();
        console.log('Rebuilding done.')
    }

    build(buildOptions: BuildOptions) {
        const { prod, watch, project, runAsync } = buildOptions;

        this._packageJSON.preprareFor(buildOptions);

        switch (this.type) {

            //#region isomorphic-lib
            case 'isomorphic-lib':
                const webpackParams = config.webpack.params(prod, watch);
                if (runAsync) {
                    run(`npm-run webpack ${webpackParams}`).async();
                } else {
                    run(`npm-run webpack ${webpackParams}`).sync()
                }
                return;
            //#endregion 

            //#region nodejs-server
            case 'nodejs-server':
                if (runAsync) {
                    run(`npm-run tsc ${watch ? '-w' : ''}`).async();
                } else {
                    run(`npm-run tsc ${watch ? '-w' : ''}`).sync()
                }
                return
            //#endregion

            //#region angular-lib
            case 'angular-lib':
                if (watch) {
                    run('npm-run ng server', { biggerBuffer: true, folder: 'preview' }).async()
                    watcher.run(Project.BUILD_WATCH_ANGULAR_LIB, 'preview/components/src');
                } else {
                    run(`npm run build:lib`, { folder: 'preview' }).sync();
                }
                return;
            //#endregion

            //#region angular-cli
            case 'angular-cli':
                if (runAsync) {
                    run('npm-run ng server').async()
                } else {
                    run('npm-run ng server').sync()
                }
                return;
            //#endregion

            //#region angular-client
            case 'angular-client':
                if (runAsync) {
                    run(`npm-run webpack-dev-server --port=${4201}`).async();
                } else {
                    run(`npm-run webpack-dev-server --port=${4201}`).sync()
                }
                return;
            //#endregion

            //#region workspace
            case 'workspace':
                this.children.forEach(child => {
                    buildOptions.runAsync = true;
                    buildOptions.watch = true;
                    this.build(buildOptions)
                })
                return;
            //#endregion 

        }
    }
    //#endregion

    //#region files recreatetion
    filesToRecreateBeforeBuild(): RecreateFile[] {
        const workspace = Project.by('workspace');
        const files: RecreateFile[] = [];
        if (this.type === 'isomorphic-lib') {
            files.push({
                from: path.join(this.location, 'src', 'client.ts'),
                where: path.join(process.cwd(), 'src', 'client.ts')
            })
        }
        return files.concat(this.commonFiles())
    }

    filesToRecreateAfterBuild(): RecreateFile[] {
        const files: RecreateFile[] = [];
        if (this.type === 'isomorphic-lib') {
            const f = ['client.d.ts', 'client.js', 'client.js.map']
            f.forEach(file => {
                files.push({
                    where: path.join(process.cwd(), file),
                    from: path.join(process.cwd(), config.folder.watchDist, file),
                })
            })
        }
        return files;
    }


    private commonFiles(): RecreateFile[] {
        const wokrspace = Project.by('workspace');
        const files = [
            'index.js',
            'index.d.ts',
            'index.js.map',
            '.npmrc',
            '.gitignore',
            '.npmignore',
            'tslint.json'
        ];
        return files.map(file => {
            return { from: path.join(wokrspace.location, file), where: path.join(process.cwd(), file) }
        })
    }
    //#endregion

    //#region get project 
    public static by(libraryType: LibType): Project {
        let projectPath;
        if (libraryType === 'workspace') {
            return Project.create(path.join(__dirname, `../projects`));
        }
        projectPath = path.join(__dirname, `../projects/${libraryType}`);
        if (!fs.existsSync(projectPath)) {
            error(`Bad library type: ${libraryType}`)
        }
        return Project.create(projectPath);
    }

    public static Current = Project.create(process.cwd());
    public static Tnp = Project.create(path.join(__dirname, '..'));

    public static from(folderPath: string): Project[] {
        const subdirectories: string[] = Filehound.create()
            .path(folderPath)
            .depth(0)
            .directory()
            .findSync()
        // error(subdirectories)
        const result = subdirectories.map(dir => {
            return Project.create(dir);
        })
        return result;
    }

    cloneTo(destinationPath: string): Project {
        const options: fse.CopyOptions = {
            overwrite: true,
            recursive: true,
            errorOnExist: true
        };
        fse.copySync(this.location, destinationPath, options);
        console.log(chalk.green(`${this.type.toUpperCase()} library structure created sucessfully, installing npm...`));
        const project = Project.create(destinationPath);
        console.log(chalk.green('Done.'));
        return project;
    }

    static create(location: string): Project {
        if (!fs.existsSync(location)) return;
        if (!PackageJSON.from(location)) return;
        return new Project(location)
    }

    private constructor(public location: string) {
        if (fs.existsSync(location)) {

            this._packageJSON = PackageJSON.from(location);
            this.type = this._packageJSON.type;
            if (!this.type) {
                if (fs.existsSync(path.join(location, 'angular-cli.json'))) {
                    this.type = 'angular-cli';
                }
                error("Bad project type " + this.type)
            }

            this.children = Project.from(location);
            this.parent = Project.create(path.join(location, '..'));
            this.preview = Project.create(path.join(location, 'preview'));

        } else {
            warn(`Invalid project location: ${location}`);
        }
    }
    //#endregion

    //#region getters
    get name(): string {
        return this._packageJSON.name;
    }

    get version() {
        return this._packageJSON.version;
    }

    get resources(): string[] {
        return this._packageJSON.resources;
    }
    //#endregion

};
