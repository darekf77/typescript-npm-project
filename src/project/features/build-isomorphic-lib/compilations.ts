//#region @backend
import * as _ from 'lodash';

import { BroswerCompilation, OutFolder, BackendCompilation } from 'morphi/build';
import { ExtendedCodeCut } from './browser-code-cut.backend';
import { EnvConfig } from '../../../models';
import { Project } from '../../abstract';
import { compilationWrapperTnp, error } from '../../../helpers';

export class BackendCompilationExtended extends BackendCompilation {

  CompilationWrapper = compilationWrapperTnp;
  compile(watch = false) {

    // QUICK_FIX for backend in tnp projects
    const currentProject = Project.From(this.cwd);
    const generatedDeclarations = !currentProject.isWorkspaceChildProject;
    this.tscCompilation(this.compilationFolderPath, watch, `../${this.outFolder}` as any, generatedDeclarations);
  }


}


export class BroswerForModuleCompilation extends BroswerCompilation {

  private ENV: EnvConfig;
  get customCompilerName() {

    if (this.ENV) {
      return `Browser Extended compilation for ${this.ENV.currentProjectName}`;
    }
    return `Browser Extended compilation`
  }

  CompilationWrapper = compilationWrapperTnp;

  constructor(
    private compilationProject: Project,
    private module: string,
    ENV: EnvConfig,
    sourceOut: string,
    outFolder: OutFolder,
    location: string,
    cwd: string,
    backendOut: string) {

    super(sourceOut, outFolder, location, cwd, backendOut)
    this.compilerName = this.customCompilerName;

    this.initCodeCut.call(this, ENV, compilationProject)


  }

  codeCuttFn(cutIftrue: boolean) {
    return function (expression: string, e: EnvConfig) {
      expression = expression.trim().replace(/\-\-\>$/, '')
      const exp = `(function(ENV){
        // console.log(typeof ENV)
        return ${expression.trim()}
      })(e)`;
      // console.log(exp)
      try {
        const res = eval(exp);
        return cutIftrue ? res : !res;
      } catch (err) {
        error(err, true, true);
      }
      return false;
    }
  }

  initCodeCut() {
    let env: EnvConfig = arguments[0]
    const compilationProject: Project = arguments[1];
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
      compilationProject);
  }


}
//#endregion
