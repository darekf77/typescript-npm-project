//#region @backend
import * as path from 'path';
import * as fs from 'fs';
import * as child from 'child_process';
// third part
import { Project } from "../abstract";
import { BuildOptions } from '../features';



/**
 * DO NOT USE environment variables in this project directly
 */
export class ProjectUnknowNpm extends Project {
  buildLib() {
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
//#endregion
