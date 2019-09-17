//#region @backend
import * as _ from 'lodash';
import * as path from 'path';

import { BroswerCompilation, OutFolder, BackendCompilation } from 'morphi/build';
import { ExtendedCodeCut } from './browser-code-cut.backend';
import { Models } from '../../../models';
import { Project } from '../../abstract';
import { Helpers } from '../../../helpers';
import { BuildOptions } from '../../features/build-process';

export class BackendCompilationExtended extends BackendCompilation {

  CompilationWrapper = Helpers.compilationWrapper as any;
  compile(watch = false) {

    // QUICK_FIX for backend in tnp projects
    const currentProject = Project.From(this.cwd);
    const generatedDeclarations = !currentProject.isWorkspaceChildProject;
    this.tscCompilation(this.compilationFolderPath, watch, `../${this.outFolder}` as any, generatedDeclarations);
  }


}


export class BroswerForModuleCompilation extends BroswerCompilation {

  compile(watch: boolean) {
    try {
      super.compile(watch);
    } catch (e) {
      Helpers.error(`Browser compilation fail: ${e}`, false, true);
    }
  }
  get customCompilerName() {

    if (this.ENV) {
      return `Browser Extended compilation for ${this.ENV.currentProjectName}`;
    }
    return `Browser Extended compilation`
  }

  CompilationWrapper = Helpers.compilationWrapper as any;

  constructor(
    private compilationProject: Project,
    private module: string,
    public ENV: Models.env.EnvConfig,
    sourceOut: string,
    outFolder: OutFolder,
    location: string,
    cwd: string,
    backendOut: string,
    public buildOptions: BuildOptions
  ) {
    super(sourceOut, outFolder, location, cwd, backendOut)
    this.compilerName = this.customCompilerName;

  }

  codeCuttFn(cutIftrue: boolean) {
    return function (expression: string, e: Models.env.EnvConfig, absoluteFilePath?: string) {

      let result = false;

      // console.log(`------------------------`)
      // console.log('cutIftrue', cutIftrue)
      if (!e) {
        // console.log(`No environment`, e)
      } else {
        // console.log({
        //   currentProjectName: e.currentProjectName,
        //   currentProjectLocation: e.currentProjectLocation
        // } as EnvConfig);
        const exp = `(function(ENV){
          // console.log(typeof ENV)
          return ${expression.trim()}
        })(e)`;

        try {
          const res = eval(exp);
          // console.log(`[${path.basename(absoluteFilePath)}] Eval (${expression}) => ${res}`)
          result = cutIftrue ? res : !res;
        } catch (err) {
          // console.log(`Expression Failed`, err)
          Helpers.error(`[codecutFn] Eval failed `);
          Helpers.error(err, true, true);
        }
      }
      // console.log(`Finally cut code  ? ${result} for ${path.basename(absoluteFilePath)}`)
      return result;
    }
  }

  initCodeCut(filesPathes: string[]) {
    // console.log('inside')
    let env: Models.env.EnvConfig = this.ENV;
    const compilationProject: Project = this.compilationProject;
    const buildOptions = this.buildOptions;
    if (!compilationProject) {
      return;
    }
    env = _.cloneDeep(env);
    this.ENV = env;
    // console.log('here1')

    let project: Project;
    if (env) {
      project = Project.From(env.currentProjectLocation);
    }
    if (compilationProject.type === 'angular-lib') {
      project = compilationProject;
    }
    // @LAST FIX FILE PATHES
    filesPathes = filesPathes.map(f => {
      return f.replace(path.join(this.cwd, this.location), '').replace(/^\//, '');
    })
    // console.log('this.compilationFolderPath', this.compilationFolderPath)
    // console.log('filesPathes', filesPathes)
    // process.exit(0)
    this.codecut = new ExtendedCodeCut(this.compilationFolderPath, filesPathes, {
      replacements: [
        ((compilationProject.type === 'isomorphic-lib') && ["@backendFunc", `return undefined;`]) as any,
        ((compilationProject.type === 'isomorphic-lib') && "@backend") as any,
        ["@cutCodeIfTrue", this.codeCuttFn(true)],
        ["@cutCodeIfFalse", this.codeCuttFn(false)]
      ].filter(f => !!f),
      env
    }, project,
      compilationProject,
      buildOptions,
      this.sourceOutBrowser
      );
    // console.log('here2')
  }


}
//#endregion
