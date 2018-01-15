
import * as Filehound from 'filehound';
import * as fs from 'fs';
import * as fse from "fs-extra";
import chalk from 'chalk';
import * as path from 'path';

import { PackageJSON } from "./package-json";
import { LibType, BuildOptions, RecreateFile, Dependencies } from "./models";
import { error, info, warn } from "./messages";
import config from "./config";
import { run } from "./process";

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
    build(buildType: BuildOptions) {
        this._packageJSON.preprareFor(buildType);
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
            return new Project(path.join(__dirname, `../projects`));
        }
        projectPath = path.join(__dirname, `../projects/${libraryType}`);
        if (!fs.existsSync(projectPath)) {
            error(`Bad library type: ${libraryType}`)
        }
        return new Project(projectPath);
    }

    public static Current = new Project(process.cwd());
    public static Tnp = new Project(path.join(__dirname, '..'));

    public static from(folderPath: string): Project[] {
        const subdirectories: string[] = Filehound.create()
            .path(folderPath)
            .directory()
            .findSync()

        const result = subdirectories.map(dir => {
            return new Project(dir);
        })
        return result;
    }

    clone(destinationPath: string): Project {
        const options: fse.CopyOptions = {
            overwrite: true,
            recursive: true,
            errorOnExist: true
        };
        fse.copySync(this.location, destinationPath, options);
        console.log(chalk.green(`${this.type.toUpperCase()} library structure created sucessfully, installing npm...`));
        const project = new Project(destinationPath);
        console.log(chalk.green('Done.'));
        return project;
    }

    //#endregion

    //#region constructor
    constructor(public location: string) {
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

            const parentPath = path.join(location, '..');
            if (fs.existsSync(parentPath)) {
                this.parent = new Project(parentPath)
            }

            const previewPath = path.join(location, 'preview');
            if (fs.existsSync(previewPath)) {
                this.preview = new Project(previewPath);
            }

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
