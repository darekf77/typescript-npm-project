//#region @backend
import chalk from 'chalk';
import { BaseProjectLib } from "./base-project-lib";
import { AngularProject } from "./project-angular";
import { BuildOptions, BuildDir } from "../models";
import { error } from "../messages";
import config from "../config";
import { Project } from './base-project';
import { AnglarLibModuleDivider } from '../build-isomorphic-lib/angular-lib-module-build';
export class ProjectAngularLib extends BaseProjectLib {

  private angular: AngularProject;
  public moduleDivider: AnglarLibModuleDivider;

  constructor(public location: string) {
    super(location);
    this.angular = new AngularProject(location);
    this.moduleDivider = new AnglarLibModuleDivider(this);
    this.angular.env = this.env; // TODO QUICK_FIX
  }

  public setDefaultPort(port: number) {
    this.angular.setDefaultPort(port)
  }

  public getDefaultPort() {
    return this.angular.getDefaultPort()
  }

  protected startOnCommand(args) {
    const command = this.angular.startOnCommand(args);
    // console.log(`Command is running async: ${command}`)
    return command;
  }


  projectSpecyficFiles() {
    return super.projectSpecyficFiles().concat([
      'gulpfile.ts',
      'ng-package.json',
      'tsconfig-aot.bundle.json',
      'tsconfig-aot.dist.json',
      'src/tsconfig.packages.json'
    ]).concat(this.angular.projectSpecyficFiles());
  }

  buildLib(outDir: BuildDir, prod?: boolean, watch?: boolean) {
    if (watch) {
      this.run(`rimraf ${outDir}`, { tryAgainWhenFailAfter: 1000 }).sync()
      if (outDir === 'dist') {
        this.run(`rimraf ${config.folder.module} && tnp ln ${outDir} ./${config.folder.module}`).sync()
      }
      this.run(`npm-run gulp inline-templates-${outDir}-watch`, { output: true }).async()
      setTimeout(() => {
        this.run(`npm-run ngc -w -p tsconfig-aot.${outDir}.json`).async()
      }, 3000)

    } else {
      this.compilationWrapper(() => {
        this.run(`rimraf ${outDir}`, { tryAgainWhenFailAfter: 1000 }).sync()
        this.run(`npm-run gulp inline-templates-${outDir}`, { output: true }).sync()
        this.run(`npm-run ngc -p tsconfig-aot.${outDir}.json`).sync()
        if (outDir === 'dist') {
          this.run(`rimraf ${config.folder.module} && tnp ln ${outDir} ./${config.folder.module}`).sync()
        }
      }, `angular-lib (project ${this.name})`)
    }
    return this;
  }

  private get divideCompilationTaskName() {
    return `divide module compilation of ${chalk.bold(this.name)}`
  }

  async buildSteps(buildOptions?: BuildOptions) {
    const { prod, watch, outDir, appBuild, onlyWatchNoBuild } = buildOptions;



    if (!onlyWatchNoBuild) {
      if (appBuild) {
        await this.angular.buildSteps(buildOptions);
      } else {
        if (watch) {
          this.buildLib(outDir, prod, false);
          this.moduleDivider.initAndWatch(this.divideCompilationTaskName)
          this.buildLib(outDir, prod, true)
        } else {
          this.buildLib(outDir, prod, watch)
          this.moduleDivider.init(this.divideCompilationTaskName)
        }
      }
    }

  }


}

//#endregion
