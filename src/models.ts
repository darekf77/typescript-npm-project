import { Project } from "./project";

export type InstalationType = '-g' | '--save' | '--save-dev';

export type Dependencies = 'dependencies' | 'devDependencies' | 'peerDependencies';

export type Package = { name: string; version: string; };

export type LibType = "angular-lib" | "isomorphic-lib" | 'angular-client' | 'nodejs-server' | 'workspace' | 'angular-cli';

export type RecreateFile = { where: string; from: string };

export type BuildDir  = 'dist' | 'bundle';

export interface BuildOptions {
    prod: boolean;
    outDir: 'dist' | 'bundle';
    watch?: boolean;
    project: Project;
}

export interface RunOptions {

    /**
     * Show process output
     */
    output?: boolean;
    cwd?: string;

    /**
     * Use big buffer for big webpack logs
     */
    biggerBuffer?: boolean;
}
