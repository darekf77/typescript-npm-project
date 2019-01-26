//#region @backend
import { Project } from '../../project/base-project';
import { EnvironmentName } from '../../models';
import { BuildInstance } from './build-instance';
import { DBBaseEntity } from './base-entity';


export class IDomainInstance {
  address: string;
  // sockets: boolean;
  // secure: boolean;
  // production: boolean;
}


export class DomainInstance extends DBBaseEntity<DomainInstance> implements IDomainInstance {
  isEqual(anotherInstace: DomainInstance): boolean {
    return this.address === anotherInstace.address;
  }

  address: string;
  // sockets: boolean = true;
  // secure: boolean = false;
  // production: boolean = false;
  declaredIn: {
    project: Project;
    environment: EnvironmentName
  }[] = [];
  get activeFor(): BuildInstance {
    return
  }
}
//#endregion
