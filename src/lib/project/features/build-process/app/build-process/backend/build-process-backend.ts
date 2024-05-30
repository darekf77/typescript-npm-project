//#region imports
import { BuildProcess } from '../build-process';
import type { BuildProcessController } from '../build-process.controller';
//#endregion

/**
 * Backend (websql also) methods for BuildProcess
 *
 * + use entites injected controllers to access other backends
 * + don't use controllers methods/properties here
 */
export class BuildProcessBackend {
  //#region initialization
  public static for(ctrl: BuildProcessController) {
    return new BuildProcessBackend(ctrl);
  }
  private get repo() {
    return this.ctrl.repository;
  }
  private constructor(private ctrl: BuildProcessController) {}
  //#endregion

  //#region count entities
  async countEntities() {
    await this.ctrl.repository.count();
  }
  //#endregion

  //#region init example data
  async initExampleDbData() {
    // await this.repo.save(BuildProcess.from({ description: 'hello world' }))
    // const all = await this.repo.find()
  }
  //#endregion
}
