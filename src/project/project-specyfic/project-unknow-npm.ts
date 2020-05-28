//#region @backend
import * as path from 'path';
import * as fs from 'fs';
import * as child from 'child_process';
import { Project } from '../abstract';
//#endregion
import { BuildOptions } from 'tnp-db';
import { CLASS } from 'typescript-class-helpers';

/**
 * DO NOT USE environment variables in this project directly
 */
//#region @backend
@CLASS.NAME('ProjectUnknowNpm')
//#endregion
export class ProjectUnknowNpm
  //#region @backend
  extends Project
//#endregion
{
  async buildLib() { }
  projectSpecyficFiles(): string[] {
    //#region @backendFunc
    return []
    //#endregion
  }
  async buildSteps(buildOptions?: BuildOptions) {
    //#region @backend
    throw new Error("Method not implemented.");
    //#endregion
  }
  protected startOnCommand(args: string): string {
    //#region @backendFunc
    throw new Error("Method not implemented.");
    //#endregion
  }
}
