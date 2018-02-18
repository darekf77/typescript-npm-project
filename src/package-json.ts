import * as _ from "lodash";
import * as fs from 'fs';
import * as path from 'path';

import { LibType, InstalationType, BuildOptions, Dependencies, Package } from "./models";
import { error, info, warn } from "./messages";
import { run } from "./process";
import { Project } from "./project";

//#region package json
export interface IPackageJSON {
    name: string;
    version: string;
    description: string;
    scripts: Object;
    tnp: {
        type: LibType;
        resources: string[];
    };
    peerDependencies: Object;
    dependencies: Object;
    devDependencies: Object;
}
//#endregion

export class PackageJSON {

    private data: IPackageJSON;

    //#region constructor
    constructor(data: Object, private location: string) {
        this.data = _.merge({
            dependencies: {},
            devDependencies: {},
            peerDependencies: {},
            tnp: {
                resources: []
            }
        } as IPackageJSON, data as any);
    }
    //#endregion

    installNodeModules(buildOptions?: BuildOptions) {
        const yarnLock = path.join(this.location, 'yarn.lock');
        if (!this.checkNodeModulesInstalled()) {
            if (fs.existsSync(yarnLock)) {
                info(`Installing npm packages in ${this.name}... from yarn.lock `)
                run('yarn install', { cwd: this.location, output: false }).sync()
            } else {
                info(`Installing npm packages in ${this.name}... `);
                run('npm i', { cwd: this.location, output: false }).sync()
            }
        }
    }

    private projectFromLocalVersion(version: string): Project {
        if (/file\:.+/g.test(version)) {
            const name = version.replace('file:', '');
            const location = path.join(this.location, name)
            return Project.from(location);
        }
    }

    getLinkedProjects(dependencyType: Dependencies = 'dependencies'): Project[] {
        if (!this.data) return [];
        const dependencies = this.data.dependencies;
        let localLinkedProjects: Project[] = [];
        _.forEach(dependencies, (version, name) => {
            const project = this.projectFromLocalVersion(version as any);
            if (project) localLinkedProjects.push(project)
        })
        return localLinkedProjects;
    }

    // install(packageName?: string, type: InstalationType = '--save-dev', exact = false) {
    //     const yarnLock = path.join(this.location, 'yarn.lock');

    //     if (!this.checkNodeModules()) {
    //         // if (fs.existsSync(yarnLock)) {
    //         //     info(`Installing npm packge ${packageName} with yarn.`)
    //         //     run(`yarn add ${packageName} ${type}`, { cwd: this.location })
    //         // } else {
    //         //     info(`Installing npm packge ${packageName} with npm.`)
    //         //     run(`npm i ${packageName} ${type}`, { cwd: this.location })
    //         // }
    //         )
    //     }
    // }

    checkNodeModulesInstalled() {
        const clientNodeModules = path.join(this.location, 'node_modules');
        // return (run("check-dependencies").sync().toString().trim() === '')
        // console.log('this.location', this.location)
        return fs.existsSync(clientNodeModules)
    }

    public static from(location: string): PackageJSON {
        const isTnpProject = (location === path.join(__dirname, '..'));
        const filePath = path.join(location, 'package.json');
        if (!fs.existsSync(filePath)) {
            // warn(`No package.json in folder: ${path.basename(location)}`)
            return;
        }
        try {
            const file = fs.readFileSync(filePath, 'utf8').toString();
            const json = JSON.parse(file);
            if (!json.tnp && !isTnpProject) {
                error(`Unrecognized project type ${filePath}`);
            }
            return new PackageJSON(json, location);
        } catch (err) {
            error(`Error while parsing package.json in: ${filePath}`);
            error(err)
        }
    }

    dependencies(type: Dependencies): Package[] {
        const packages: Package[] = [];
        _.forIn(this.data[type], (version, name) => {
            packages.push({ name, version: version as any })
        })
        return packages;
    }

    //#region getters

    get type(): LibType {
        return this.data.tnp.type;
    }

    get name() {
        return this.data.name;
    }

    get version() {
        return this.data.version;
    }

    get resources(): string[] {
        const p = this.data.tnp;
        return Array.isArray(p.resources) ? p.resources : [];
    }
    //#endregion

}
