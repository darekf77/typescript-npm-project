import { Project } from "./project";

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
export type TnpRoute = { url: string; project: Project; }

export class BuildOptions {
    prod: boolean;
    outDir: BuildDir;
    watch?: boolean;
    forSite?: boolean;

    public static stringify(prod = false, watch = false, outDir: BuildDir = 'dist', forSite = false) {
        const o = {
            env: [
                '--env.prod=' + prod,
                '--env.watch=' + watch,
                '--env.outDir=' + outDir,
                '--env.forSite=' + forSite
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
