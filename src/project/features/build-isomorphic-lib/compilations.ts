//#region @backend
import * as _ from 'lodash';

import { BroswerCompilation, OutFolder, BackendCompilation } from 'morphi/build';
import { ExtendedCodeCut } from './browser-code-cut';
import { EnvConfig } from '../../../models';
import { Project } from '../../abstract';

export class BackendCompilationExtended extends BackendCompilation {


  compile(watch = false) {

    // QUICK_FIX for backend in tnp projects
    const currentProject = Project.From(this.cwd);
    const generatedDeclarations = !currentProject.isWorkspaceChildProject;
    this.tscCompilation(this.compilationFolderPath, watch, `../${this.outFolder}` as any, generatedDeclarations);
  }


}


export class BroswerForModuleCompilation extends BroswerCompilation {

  constructor(private module: string,
    private ENV: EnvConfig,
    sourceOut: string,
    outFolder: OutFolder,
    location: string,
    cwd: string,
    backendOut: string) {

    super(sourceOut, outFolder, location, cwd, backendOut)
    if (ENV) {
      this.initCodeCut.call(this, ENV);
    }

  }

  codeCuttFn(cutIftrue: boolean) {
    return function (expression: string, e: EnvConfig) {
      const exp = `(function(ENV){
        // console.log(typeof ENV)
        return ${expression.trim()}
      })(e)`;
      // console.log(exp)
      const res = eval(exp);
      return cutIftrue ? res : !res;
    }
  }

  customEnv: EnvConfig;
  initCodeCut() {

    const env = arguments[0];
    if (!_.isObject(env)) {
      return;
    }
    this.customEnv = _.merge(_.cloneDeep(env), { currentProjectName: this.module });
    // console.log('customEnv', this.customEnv)

    this.codecut = new ExtendedCodeCut(this.compilationFolderPath, this.filesAndFoldesRelativePathes, {
      replacements: [
        ["@backendFunc", `return undefined;`],
        "@backend",
        ["@cutRegionIfTrue", this.codeCuttFn(true)],
        ["@cutRegionIfFalse", this.codeCuttFn(false)]
      ],
      env: this.customEnv
    })
  }


}
//#endregion
