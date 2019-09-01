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

  CompilationWrapper = Helpers.compilationWrapperTnp as any;
  compile(watch = false) {

    // QUICK_FIX for backend in tnp projects
    const currentProject = Project.From(this.cwd);
    const generatedDeclarations = !currentProject.isWorkspaceChildProject;
    this.tscCompilation(this.compilationFolderPath, watch, `../${this.outFolder}` as any, generatedDeclarations);
  }


}


export class BroswerForModuleCompilation extends BroswerCompilation {

  private ENV: Models.env.EnvConfig;

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

  CompilationWrapper = Helpers.compilationWrapperTnp as any;

  constructor(
    private compilationProject: Project,
    private module: string,
    ENV: Models.env.EnvConfig,
    sourceOut: string,
    outFolder: OutFolder,
    location: string,
    cwd: string,
    backendOut: string,
    public buildOptions: BuildOptions
  ) {

    super(sourceOut, outFolder, location, cwd, backendOut)
    this.compilerName = this.customCompilerName;

    this.initCodeCut.call(this, ENV, compilationProject, buildOptions)


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

  initCodeCut() {
    let env: Models.env.EnvConfig = arguments[0]
    const compilationProject: Project = arguments[1];
    const buildOptions = arguments[2];
    if (!compilationProject) {
      return;
    }
    env = _.cloneDeep(env);
    this.ENV = env;

    this.codecut = new ExtendedCodeCut(this.compilationFolderPath, this.filesAndFoldesRelativePathes, {
      replacements: [
        ((compilationProject.type === 'isomorphic-lib') && ["@backendFunc", `return undefined;`]) as any,
        ((compilationProject.type === 'isomorphic-lib') && "@backend") as any,
        ["@cutCodeIfTrue", this.codeCuttFn(true)],
        ["@cutCodeIfFalse", this.codeCuttFn(false)]
      ].filter(f => !!f),
      env
    }, env ? Project.From(env.currentProjectLocation) : void 0,
      compilationProject,
      buildOptions);
  }


}
//#endregion
