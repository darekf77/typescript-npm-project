import { BaseProjectLib } from "./base-project-lib";
import { AngularProject } from "./project-angular";
import { BuildOptions, BuildDir } from "../models";
import { error } from "../messages";
import config from "../config";

export class ProjectAngularLib extends BaseProjectLib {

    private angular: AngularProject;

    constructor(public location: string) {
        super(location);
        this.angular = new AngularProject(location);
    }

    protected runOn(port?: number, async?: boolean) {
        this.angular.runOn(port, async);
    }

    protected defaultPort: number = 4100;

    projectSpecyficFiles() {
        return super.projectSpecyficFiles().concat([
            'gulpfile.js',
            'ng-package.json',
            'tsconfig-aot.bundle.json',
            'tsconfig-aot.dist.json'
        ]).concat(this.angular.projectSpecyficFiles());
    }

    buildLib(outDir: BuildDir) {
        this.compilationWrapper(() => {
            this.run(`tnp rimraf ${outDir}`).sync()
            this.run(`tnp npm-run gulp inline-templates-${outDir}`, { output: false }).sync()
            this.run(`tnp npm-run ngc -p tsconfig-aot.${outDir}.json`).sync()
            if (outDir === 'dist') {
                this.run(`tnp rimraf ${config.folder.module} && tnp ln ${outDir} ${config.folder.module}`).sync()
            }
        }, `angular-lib (project ${this.name})`)
        return this;
    }

    buildSteps(buildOptions?: BuildOptions) {
        const { prod, watch, outDir, appBuild } = buildOptions;
        if (appBuild) {
            this.angular.buildSteps(buildOptions);
        } else {
            if (watch) {
                const p = (prod ? ':prod' : '');
                this.watcher.run(`tnp build:${outDir}${p}`, 'components/src');
            } else {
                this.buildLib(outDir)
            }
        }
    }

}

