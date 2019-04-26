//#region @backend
import { Project } from '../../project/project';
import { EnvironmentName } from '../../models';
import { BuildInstance } from './build-instance';
import { DBBaseEntity } from './base-entity';


export class IDomainInstance {
  address: string;
  // sockets: boolean;
  // secure: boolean;
  // production: boolean;
}


export class DomainInstance extends DBBaseEntity implements IDomainInstance {
  isEqual(anotherInstace: DomainInstance): boolean {
    return this.address === anotherInstace.address;
  }
  constructor(
    public address: string = ''
    // sockets: boolean = true;
    // secure: boolean = false;
    // production: boolean = false;

  ) {
    super()
  }


  declaredIn: {
    project: Project;
    environment: EnvironmentName
  }[] = [];
  get activeFor(): BuildInstance {
    return
  }
}
//#endregion
