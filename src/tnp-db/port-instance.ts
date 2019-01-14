//#region @backend
import { Project } from '../project/base-project';
import { SystemService } from './system-service';


export class PortInstance {

  number: number | number[];
  reservedFor: Project | SystemService;

}
//#endregion
