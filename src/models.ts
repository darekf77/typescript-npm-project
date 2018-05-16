import { Project } from "./project/base-project";


export type FileEvent = 'created' | 'changed' | 'removed' | 'rename';

export type InstalationType = '-g' | '--save' | '--save-dev';

export type Dependencies = 'dependencies' | 'devDependencies' | 'peerDependencies';

export type Package = { name: string; version: string; };

export type LibType = "angular-lib" | "isomorphic-lib" | 'angular-client' | "ionic-client" | 'server-lib' | 'workspace' | 'angular-cli' | 'docker';

export type RecreateFile = { where: string; from: string };

export type BuildDir = 'dist' | 'bundle';

export type RuleDependency = { dependencyLib: Project; beforeProject: Project };

export interface TnpRouter {
    url?: {
        prefix?: string;
        base?: string;
    };
    routes: TnpRoute[];
}
export type TnpRoute = { url: string; localEnvPort: number, project: string; }

export class BuildOptions {
    prod: boolean;
    outDir: BuildDir;
    watch?: boolean;
    appBuild?: boolean;
    copyto?: Project[];
    additionalIsomorphicLibs?: string[];

    public static stringify(prod = false, watch = false, outDir: BuildDir = 'dist', additionalIsomorphicLibs = []) {
        const o = {
            env: [
                '--env.prod=' + prod,
                '--env.watch=' + watch,
                '--env.outDir=' + outDir,
                '--env.additionalIsomorphicLibs=' + encodeURIComponent(additionalIsomorphicLibs.toString())
            ]
        }
        return `${o.env.join(' ')}`;
    }

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


export interface WatchOptions {
    cwd: string;
    wait?: number;
}


import { ConnectionOptions } from "typeorm";

export interface EnvConfig {

    /**
     * Check where code comes from baseline or site
     */
    isBaseline: boolean;

    /**
     * Check wheter code is minified, mangled, gzipped
     *
     * @type {Boolean}
     * @memberof Config
     */
    productionBuild: Boolean;
    /**
     * Use ahead of time compilation for angular
     *
     * @type {Boolean}
     * @memberof Config
     */
    aot: Boolean;
    /**
     * Environment name
     *
     * @type {Boolean}
     * @memberof Config
     */
    name: 'local' | 'dev' | 'stage' | 'prod';
    /**
     * Use routes from package.json and random assigned ports
     *
     * @type {Boolean}
     * @memberof Config
     */
    useRouter: () => Boolean;
    /**
     * Routes for router
     *
     * @type {{ url: string; project: string; defaultPort: string; }[]}
     * @memberof Config
     */
    routes: { url: string; project: string; localEnvPort: number; }[]
    db: ConnectionOptions;
    /**
     * Get host for package
     *
     * @memberof Config
     */
    host: (packageName: string) => string;
}

