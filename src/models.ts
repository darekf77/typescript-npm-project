

export type LibType = "angular-lib" | "isomorphic-lib" | 'angular-client' | 'nodejs-server';

export interface PackageJSON {
    name: string;
    version: string;
    description: string;
    scripts: Object;
    tnp: {
        type: LibType;
        resources: string[];
    },
    peerDependencies: Object;
    dependencies: Object;
    devDependencies: Object;
}
