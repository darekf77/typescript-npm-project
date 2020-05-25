//#region @backend
import * as path from 'path';
import * as fs from 'fs';
import * as child from 'child_process';
// third part
import { Project } from '../abstract';
import { BuildOptions } from '../features';
import { CLASS } from 'typescript-class-helpers';
//#endregion


/**
 * DO NOT USE environment variables in this project directly
 */
@CLASS.NAME('ProjectUnknowNpm')
export class ProjectUnknowNpm
  //#region @backend
  extends Project
//#endregion
{
  async buildLib() {
    // throw new Error("Method not implemented.");
  }
  projectSpecyficFiles(): string[] {
    return []
  }
  async buildSteps(buildOptions?: BuildOptions) {
    throw new Error("Method not implemented.");
  }
  protected startOnCommand(args: string): string {
    throw new Error("Method not implemented.");
  }



}

