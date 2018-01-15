import chalk from 'chalk';
import * as path from 'path';
import * as fs from 'fs';

import { error } from "./messages";

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




export type InstalationType = '-g' | '--save' | '--save-dev';

export type LibType = "angular-lib" | "isomorphic-lib" | 'angular-client' | 'nodejs-server' | 'workspace';

export type BuildType = 'build-dist' | 'build-bundle';




export type RecreateFile = { where: string; from: string };

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
