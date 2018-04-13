import * as _ from "lodash";
import * as fs from 'fs';
import * as path from 'path';

import {
    LibType, InstalationType, BuildOptions,
    Dependencies, Package, TnpRouter, TnpRoute
} from "../models";
import { error, info, warn } from "../messages";
import { run } from "../process";
import { Project } from "./base-project";
import { ProjectFrom } from "./index";
import chalk from "chalk";


export interface IPackageJSON {
    name: string;
    version: string;
    tnp: {
        type: LibType;
        isCoreProject: boolean;
        basedOn: Project | string,
        resources?: string[];
        requiredLibs?: string[];
        router: TnpRouter;
    };
}


export class PackageJSON {

    private data: IPackageJSON;

    constructor(data: Object, private location: string) {
        this.data = _.merge({
            tnp: {
                resources: []
            }
        } as IPackageJSON, data as any);
    }

    installPackage(packageName?: string, type: InstalationType = '--save-dev') {
        // console.log('packageName', packageName)
        // console.log(this.location)
        const yarnLock = path.join(this.location, 'yarn.lock');
        if (fs.existsSync(yarnLock)) {
            info(`Installing npm packge: "${packageName}" with yarn.`)
            run(`yarn add ${packageName} ${type}`, { cwd: this.location }).sync()
        } else {
            info(`Installing npm packge: "${packageName}" with npm.`)
            run(`npm i ${packageName} ${type}`, { cwd: this.location }).sync()
        }
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
                error(`Unrecognized project type ${filePath}, from location: ${location}`);
            }
            return new PackageJSON(json, location);
        } catch (err) {
            error(`Error while parsing package.json in: ${filePath}`);
            error(err)
        }
    }

    //#region getters

    get requiredProjects(): Project[] {
        const projects: Project[] = [];
        if (this.data && this.data.tnp && Array.isArray(this.data.tnp.requiredLibs)) {
            const dependencies = this.data.tnp.requiredLibs;
            dependencies.forEach(p => {
                const projectPath = path.join(this.location, p);
                if (!fs.existsSync(projectPath)) {
                    error(`Dependency project: "${p}" doesn't exist.`)
                }
                projects.push(ProjectFrom(projectPath));
            })
        }
        return projects;
    }

    get type(): LibType {
        const res = this.data.tnp ? this.data.tnp.type : undefined;
        if (!res && fs.existsSync(path.join(this.location, 'angular-cli.json'))) {
            return 'angular-cli';
        }
        return res;
    }

    get routes(): TnpRoute[] {
        if (this.data && this.data.tnp && this.data.tnp.router && Array.isArray(this.data.tnp.router.routes)) {
            return this.data.tnp.router.routes.map(route => {
                return {
                    url: route.url,
                    project: ProjectFrom(path.join(this.location, route.project as any))
                }
            })
        }
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

    get basedOn(): Project {
        // console.log(this.data)
        if (this.data.tnp && this.data.tnp.basedOn) {
            if (!_.isString(this.data.tnp.basedOn)) {
                error(`Wron value for ${chalk.bold('basedOn')} in package.json  (${this.location})`)
            }
            const baseline = ProjectFrom(path.join(this.location, this.data.tnp.basedOn as string));
            if (baseline && baseline.type !== 'workspace') {
                error(`Baseline project ${chalk.bold(baseline.name)} needs to ${'workspace'} type project.`);
            }
            return baseline;
        }
    }

    get isCoreProject() {
        if (this.data.tnp && this.data.tnp.isCoreProject) {
            if (_.isBoolean(this.data.tnp.isCoreProject)) {
                return this.data.tnp.isCoreProject;
            }
            error(`Bad value in package.json, tnp.isCoreProject should be boolean.`, true);
            error(`Location of package.json: ${this.location}`)

        }
        return false;
    }

    //#endregion

}
