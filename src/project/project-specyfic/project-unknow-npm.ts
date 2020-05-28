//#region @backend
import * as path from 'path';
import * as fs from 'fs';
import * as child from 'child_process';
//#endregion
import { Project } from '../abstract';
import { BuildOptions } from 'tnp-db';
import { CLASS } from 'typescript-class-helpers';

/**
 * DO NOT USE environment variables in this project directly
 */
@CLASS.NAME('ProjectUnknowNpm')
export class ProjectUnknowNpm extends Project {
  async buildLib() { }
  projectSpecyficFiles(): string[] {
    //#region @backendFunc
    return []
    //#region
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
