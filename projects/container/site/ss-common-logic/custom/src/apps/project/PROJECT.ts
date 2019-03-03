import { Project } from 'tnp-bundle'
import { Morphi, ModelDataConfig } from 'morphi';
import { IProjectController } from './ProjectController';
import { PROCESS } from 'baseline/ss-common-logic/src/apps/process/PROCESS';
export { IProject as IPROJECT } from 'tnp-bundle'


@Morphi.Entity<PROJECT>({
  className: 'PROJECT',
  mapping: {

  }
})
export class PROJECT extends Project {
  procStaticBuild: PROCESS;
  procWatchBuild: PROCESS;
  procInitEnv: PROCESS;
  procServeStatic: PROCESS;
  procClear: PROCESS;
  ctrl: IProjectController;
  static ctrl: IProjectController;
  static async getAll(config?: ModelDataConfig, slice?: number) {
    const data = await this.ctrl.getAll(config, slice).received;
    return data.body.json;
  }
  static async getByLocation(location: string, config?: ModelDataConfig) {
    const data = await this.ctrl.getByLocation(location, config).received
    return data.body.json;
  }

  //#region @backend
  static async createProcess(process: PROCESS) {
    let res = await this.ctrl.db.PROCESS.save(process);
    return res;
  }

  static async getProcessByID(processId: number) {
    let res = await this.ctrl.db.PROCESS.findOne({ id: processId });
    return res;
  }

  //#endregion

}
