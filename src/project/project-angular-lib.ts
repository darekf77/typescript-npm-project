//#region @backend
import chalk from 'chalk';
import * as _ from 'lodash';
import { LibProject } from "./abstract";
import { ProjectAngularClient } from "./project-angular-client";
import { BuildDir } from "../models";
import { error } from "../helpers";
import config from "../config";
import { Project } from './abstract';
import { AnglarLibModuleDivider } from './features/angular-lib-module-divider';
import { Helpers } from 'morphi/helpers';
import { BuildOptions } from './features/build-options';
export class ProjectAngularLib extends LibProject {

  private projectAngularClient: ProjectAngularClient;
  public moduleDivider: AnglarLibModuleDivider;

  constructor(public location: string) {
    super(location);
    if (_.isString(location)) {
      this.projectAngularClient = new ProjectAngularClient(location);
      this.moduleDivider = new AnglarLibModuleDivider(this);
      this.projectAngularClient.env = this.env; // TODO QUICK_FIX
    }

  }

  public setDefaultPort(port: number) {
    this.projectAngularClient.setDefaultPort(port)
  }

  public getDefaultPort() {
    return this.projectAngularClient.getDefaultPort()
  }

  protected startOnCommand(args) {
    const command = this.projectAngularClient.startOnCommand(args);
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
    ]).concat(this.projectAngularClient.projectSpecyficFiles());
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
        await this.projectAngularClient.buildSteps(buildOptions);
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
