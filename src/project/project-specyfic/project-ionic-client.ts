//#region @backend
import * as path from 'path';
// local
import { Project } from "../abstract";
import { config } from "../../config";
import { BuildOptions } from '../features';

export class ProjectIonicClient extends Project {
  buildLib() {
    // throw new Error("Method not implemented.");
  }

  startOnCommand(args: string) {
    const command = `echo "hello from ionic" ${args}`;
    return command;
  }

  projectSpecyficFiles(): string[] {
    return [
      'tsconfig.json'
    ];
  }

  async buildSteps(buildOptions?: BuildOptions) {
    const { prod, watch, outDir } = buildOptions;
    if (watch) {
      this.run(`tnp npm-run ionic serve --no-open -p ${this.getDefaultPort()}`).async()
    } else {
      this.run(`tnp npm-run ionic-app-scripts build ${prod ? '--prod' : ''}`).sync();
    }
  }
}
//#endregion
