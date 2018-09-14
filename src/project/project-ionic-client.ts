import * as path from 'path';
// local
import { Project } from "./base-project";
import config from "../config";
import { BuildOptions } from '../models';

export class ProjectIonicClient extends Project {

  startOnCommand(args: string) {
    const command = `echo "hello from ionic" ${args}`;
    return command;
  }

  projectSpecyficFiles(): string[] {
    return [
      'tsconfig.json'
    ];
  }

  buildSteps(buildOptions?: BuildOptions) {
    const { prod, watch, outDir } = buildOptions;
    if (watch) {
      this.run(`tnp npm-run ionic serve --no-open -p ${this.getDefaultPort()}`).async()
    } else {
      this.run(`tnp npm-run ionic-app-scripts build ${prod ? '--prod' : ''}`).sync();
    }
  }
}
