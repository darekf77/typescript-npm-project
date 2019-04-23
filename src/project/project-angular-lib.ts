//#region @backend
import chalk from 'chalk';
import * as _ from 'lodash';
import { BaseProjectLib } from "./base-project-lib";
import { AngularProject } from "./project-angular";
import { BuildOptions, BuildDir } from "../models";
import { error } from "../helpers";
import config from "../config";
import { Project } from './base-project';
import { AnglarLibModuleDivider } from './features/build-isomorphic-lib/angular-lib-module-build';
import { Helpers } from 'morphi/helpers';
export class ProjectAngularLib extends BaseProjectLib {

  private angular: AngularProject;
  public moduleDivider: AnglarLibModuleDivider;

  constructor(public location: string) {
    super(location);
    if (_.isString(location)) {
      this.angular = new AngularProject(location);
      this.moduleDivider = new AnglarLibModuleDivider(this);
      this.angular.env = this.env; // TODO QUICK_FIX
    }

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

  async buildLib(outDir: BuildDir, forClient: Project[] = [], prod?: boolean, watch?: boolean) {

    const outputLineReplace = (line) => {
      // console.log('LINE:',line)
      return line.replace('tmp/inlined-dist/src', 'components')
    };

    if (watch) {
      this.run(`rimraf ${outDir}`, { tryAgainWhenFailAfter: 1000 }).sync()
      if (outDir === 'dist') {
        this.run(`rimraf ${config.folder.module} && tnp ln ${outDir} ./${config.folder.module}`).sync()
      }
      this.run(`npm-run gulp inline-templates-${outDir}-watch`,
        { output: false, outputLineReplace }).async()
      setTimeout(() => {
        this.run(`npm-run ngc -w -p tsconfig-aot.${outDir}.json`, { output: true, outputLineReplace }).async()
      }, 3000)

    } else {
      await Helpers.compilationWrapper(() => {
        this.run(`rimraf ${outDir}`, { tryAgainWhenFailAfter: 1000 }).sync()
        this.run(`npm-run gulp inline-templates-${outDir}`,
          { output: false, outputLineReplace }).sync()
        this.run(`npm-run ngc -p tsconfig-aot.${outDir}.json`,{ output: true, outputLineReplace }).sync()
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
    const { prod, watch, outDir, appBuild, onlyWatchNoBuild, forClient, compileOnce } = buildOptions;



    if (!onlyWatchNoBuild) {
      if (appBuild) {
        await this.angular.buildSteps(buildOptions);
      } else {
        if (watch) {
          await this.buildLib(outDir, forClient as Project[], prod, false);
          this.moduleDivider.initAndWatch(this.divideCompilationTaskName)
          if(compileOnce) {
            return;
          }
          await this.buildLib(outDir, forClient as Project[], prod, true)
        } else {
          await this.buildLib(outDir, forClient as Project[], prod, watch)
          this.moduleDivider.init(this.divideCompilationTaskName)
        }
      }
    }

  }


}

//#endregion
