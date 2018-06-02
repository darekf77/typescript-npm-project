import { BaseProjectLib } from "./base-project-lib";
import { AngularProject } from "./project-angular";
import { BuildOptions, BuildDir } from "../models";
import { error } from "../messages";
import config from "../config";
import { Project } from './base-project';

export class ProjectAngularLib extends BaseProjectLib {

    private angular: AngularProject;

    constructor(public location: string) {
        super(location);
        this.angular = new AngularProject(location);
        this.angular.env = this.env; // TODO QUICK_FIX
    }

    public setDefaultPort(port: number) {
        this.angular.setDefaultPort(port)
    }

    public getDefaultPort() {
        return this.angular.getDefaultPort()
    }

    protected startOnCommand() {
        const command = this.angular.startOnCommand();
        // console.log(`Command is running async: ${command}`)
        return command;
    }


    projectSpecyficFiles() {
        return super.projectSpecyficFiles().concat([
            'gulpfile.js',
            'ng-package.json',
            'tsconfig-aot.bundle.json',
            'tsconfig-aot.dist.json',
            'src/tsconfig.packages.json'
        ]).concat(this.angular.projectSpecyficFiles());
    }

    buildLib(outDir: BuildDir, prod?: boolean, watch?: boolean) {
        if (watch) {
            this.run(`tnp rimraf ${outDir}`).sync()
            if (outDir === 'dist') {
                this.run(`tnp rimraf ${config.folder.module} && tnp ln ${outDir} ./${config.folder.module}`).sync()
            }
            this.run(`npm-run gulp inline-templates-${outDir}-watch`, { output: false }).async()
            this.run(`npm-run ngc -w -p tsconfig-aot.${outDir}.json`).async()
            this.watchOutDir()
        } else {
            this.compilationWrapper(() => {
                this.run(`tnp rimraf ${outDir}`).sync()
                this.run(`npm-run gulp inline-templates-${outDir}`, { output: false }).sync()
                this.run(`npm-run ngc -p tsconfig-aot.${outDir}.json`).sync()
                if (outDir === 'dist') {
                    this.run(`tnp rimraf ${config.folder.module} && tnp ln ${outDir} ./${config.folder.module}`).sync()
                }
            }, `angular-lib (project ${this.name})`)
            this.copyToProjectsOnFinish();
        }
        return this;
    }

    buildSteps(buildOptions?: BuildOptions) {
        const { prod, watch, outDir, appBuild } = buildOptions;
        if (appBuild) {
            this.angular.buildSteps(buildOptions);
        } else {
            if (watch) {
                this.buildLib(outDir, prod, false);
                this.buildLib(outDir, prod, true)
            } else {
                this.buildLib(outDir, prod, watch)
            }
            // if (watch) {
            //     const p = (prod ? ':prod' : '');
            //     this.watcher.run(`tnp build:${outDir}${p}`, 'components/src', 5);
            // } else {
            //     this.buildLib(outDir)
            // }
        }
    }


}

