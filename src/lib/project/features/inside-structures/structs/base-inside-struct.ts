import { Project } from '../../../abstract/project/project';
import { InsideStruct } from '../inside-struct';

export class BaseInsideStruct {
  public readonly struct: InsideStruct;
  constructor(public readonly project: Project, public readonly websql: boolean) {

  }
}
