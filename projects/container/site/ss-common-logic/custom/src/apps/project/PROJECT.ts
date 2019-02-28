import { Project } from 'tnp-bundle'
import { Morphi, ModelDataConfig } from 'morphi';
import { IProjectController } from './ProjectController';
export { IProject as IPROJECT } from 'tnp-bundle'


@Morphi.Entity<PROJECT>({
  className: 'PROJECT',
  mapping: {

  }
})
export class PROJECT extends Project {
  ctrl: IProjectController;
  static ctrl: IProjectController;
  static async getAll(config?: ModelDataConfig) {
    const data = await this.ctrl.getAll(config).received
    return data.body.json;
  }
  static async getByLocation(location: string, config?: ModelDataConfig) {
    const data = await this.ctrl.getByLocation(location, config).received
    return data.body.json;
  }

}
