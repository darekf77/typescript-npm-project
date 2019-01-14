//#region @backend
import { Project } from '../project/base-project';


export class IDomainInstance {
  domain: string;
  isHttps: boolean;
  projectLocation: string;
}


export class DomainInstance {
  domain: string;
  isHttps: boolean;
  get reservedFor(): Project {
    return undefined;
  }
}
//#endregion
