import { Project } from '../../../abstract/project';
import { InsideStruct } from '../inside-struct';

/**
 * @deprecated
 */
export class BaseInsideStruct {
  public struct: InsideStruct;
  constructor(public readonly project: Project, public readonly websql: boolean) {

  }

}
