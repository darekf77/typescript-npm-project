//#region @backend
import * as path from 'path';
import * as fs from 'fs';
import * as child from 'child_process';
// third part
import { Project } from "./base-project";
import { error } from "../helpers";
import config from "../config";
import { BuildOptions } from './features/build-options';



/**
 * DO NOT USE environment variables in this project directly
 */
export class UnknowNpmProject extends Project {
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
