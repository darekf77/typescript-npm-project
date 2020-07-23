//#region @backend
import * as path from 'path';
import { Project } from '../abstract';
import { config } from '../../config';
//#endregion
import { BuildOptions } from 'tnp-db';
import { CLASS } from 'typescript-class-helpers';
import { Helpers } from 'tnp-helpers';

//#region @backend
@CLASS.NAME('ProjectDocker')
//#endregion
export class ProjectDocker
  //#region @backend
  extends Project
//#endregion
{
  async buildLib() { }

  startOnCommand() {
    //#region @backendFunc
    return 'echo "no docker support jet"'
    //#endregion
  }

  projectSpecyficFiles(): string[] {
    //#region @backendFunc
    return [
      'docker-help.md'
    ];
    //#endregion
  }

  set dockerImageId(id: any) {
    Helpers.writeFile(path.join(this.location,
      config.file.tmpDockerImageId), id);
  }

  get dockerImageId() {
    return Helpers.readFile(path.join(this.location,
      config.file.tmpDockerImageId));
  }

  async buildSteps(buildOptions?: BuildOptions) {
    const c = Helpers.cliTool.argsFrom<{ nocache: boolean; }>(buildOptions.args);
    Helpers.info(`building docker`);
    let dockerImageId: any;

    await this.run(`docker build ${c.nocache ? '--no-cache' : ''} -t ${this.genericName} .`, {
      output: true,
      prefix: 'docker',
      showCommand: true,
      extractFromLine: ['Successfully built', (id) => { dockerImageId = id; }]
    }).asyncAsPromise();
    Helpers.info(`DockerId: ${dockerImageId}`);
    this.dockerImageId = dockerImageId;
  }
}


