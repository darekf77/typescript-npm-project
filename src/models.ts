import chalk from 'chalk';
import * as path from 'path';
import * as fs from 'fs';

import { error } from "./errors";

export class TemplateFile {
    constructor(
        public path: string,
        public body?: string) {

    }

    get name() {
        return path.basename(this.path);
    }

    createFrom(filePath: string) {
        fs.writeFileSync(this.path, fs.readFileSync(filePath), 'utf8')
    }

    create() {
        fs.writeFileSync(this.path, this.body, 'utf8')
    }

}

export type LibType = "angular-lib" | "isomorphic-lib" | 'angular-client' | 'nodejs-server' | 'workspace';




export class Project {

    __originProject: boolean;
    constructor(public location: string) {
        this.__originProject = (this.location === path.join(__dirname, '..'));
    }

    get type(): LibType {
        const p = this.packageJSON.tnp;
        return p.type;
    }
    get packageJSON(): PackageJSON {
        const filePath = path.join(this.location, 'package.json');
        try {
            const file = fs.readFileSync(filePath, 'utf8').toString();
            const json: PackageJSON = JSON.parse(file);
            if (!json.tnp && !this.__originProject) {
                error(`Unrecognized project type ${filePath}`);
                process.exit(1);
            }
            return json;
        } catch (err) {
            console.log(chalk.red(filePath));
            error(err)
        }
    }

    get version() {
        return this.packageJSON.version;
    }

    get resources(): string[] {
        const p = this.packageJSON.tnp;
        return Array.isArray(p.resources) ? p.resources : [];
    }


};

export type Dependency = { [packageName: string]: string; };

export interface Dependencies {
    forAllLibs: Dependency;
    global: Dependency;
    lib: {
        angularLib: Dependency;
        angularClient: Dependency;
        isomorphicLib: Dependency;
        nodejsServer: Dependency;
    }
}

export interface PackageJSON {
    name: string;
    version: string;
    description: string;
    scripts: Object;
    tnp: {
        type: LibType;
        resources: string[];
        dependencies?: Dependencies;
    },
    peerDependencies: Object;
    dependencies: Object;
    devDependencies: Object;
}
