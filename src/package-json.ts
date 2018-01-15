import * as _ from "lodash";
import * as fs from 'fs';
import * as path from 'path';

import { LibType, InstalationType, BuildOptions, Dependencies, Package } from "./models";
import { error, info } from "./messages";
import { run } from "./process";

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

    preprareFor(buildOptions: BuildOptions) {
        const yarnLock = path.join(this.location, 'yarn.lock');
        if (!this.checkNodeModules()) {
            if (fs.existsSync(yarnLock)) {
                info('Installing npm packages... from yarn.lock ')
                run('yarn install').sync()
            } else {
                info('Installing npm packages... ');
                run('npm i').sync()
            }
        }
    }


    install(packageName?: string, type: InstalationType = '--save-dev', exact = false) {
        const yarnLock = path.join(this.location, 'yarn.lock');

        if (!this.checkNodeModules()) {
            if (fs.existsSync(yarnLock)) {
                info(`Installing npm packge ${packageName} with yarn.`)
                run(`yarn add ${packageName} ${type}`, { projectDirPath: this.location })
            } else {
                info(`Installing npm packge ${packageName} with npm.`)
                run(`npm i ${packageName} ${type}`, { projectDirPath: this.location })
            }
        }
    }

    private checkNodeModules() {
        const clientNodeModules = path.join(this.location, 'node_modules');
        // return (run("check-dependencies").sync().toString().trim() === '')
        return fs.existsSync(clientNodeModules)
    }

    public static from(location: string): PackageJSON {
        const isTnpProject = (location === path.join(__dirname, '..'));
        const filePath = path.join(location, 'package.json');
        try {
            const file = fs.readFileSync(filePath, 'utf8').toString();
            const json = JSON.parse(file);
            if (!json.tnp && !isTnpProject) {
                error(`Unrecognized project type ${filePath}`);
            }
            return new PackageJSON(json, location);
        } catch (err) {
            error(filePath, true);
            error(err, true)
        }
    }

    dependencies(type: Dependencies): Package[] {
        const packages: Package[] = [];
        _.forIn(this.data[type], (version, name) => {
            packages.push({ name, version: version as any })
        })
        return packages;
    }

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

}
