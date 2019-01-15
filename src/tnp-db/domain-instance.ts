//#region @backend
import { Project } from '../project/base-project';


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
}
//#endregion
