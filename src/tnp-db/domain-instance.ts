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
  sockets: boolean = true;
  secure: boolean = false;
  production: boolean = false;
  declaredIn: { project: Project; environment: EnvironmentName }[] = [];
  get activeFor(): BuildInstance {
    return
  }
}
//#endregion
