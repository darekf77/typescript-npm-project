//#region @backend
import { Project } from '../project/base-project';
import { EnvironmentName } from '../models';
import { BuildInstance } from './build-instance';


export class IDomainInstance {
  address: string;
  sockets: boolean;
  secure: boolean;
  production: boolean;
}


export class DomainInstance implements IDomainInstance {
  address: string;
  sockets: boolean;
  secure: boolean;
  production: boolean;
  get declaredIn(): { project: Project; envionment: EnvironmentName }[] {

    return [];
  }

  get activeFor(): BuildInstance {
    return
  }
}
//#endregion
