//#region @backend
import { DBBaseEntity } from './base-entity';
import { ProjectFrom, Project } from '../../project';

export class ProjectInstance extends DBBaseEntity {

  public static from(project: Project): ProjectInstance {
    if (!project) {
      return
    }
    return new ProjectInstance(project.location);
  }

  get project() {
    return ProjectFrom(this.locationOfProject);
  }

  isEqual(anotherInstace: ProjectInstance): boolean {
    return this.locationOfProject === anotherInstace.locationOfProject;
  }

  hasEqualMeta info(anotherInstace: ProjectInstance) {

  }

  constructor(
    public locationOfProject?: string
  ) {
    super()
  }

}
//#endregion

