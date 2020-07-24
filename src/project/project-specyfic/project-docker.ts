//#region @backend
import * as path from 'path';
import * as _ from 'lodash';
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
  stop() {
    const imageId = this.dockerImageId;
    if (!_.isString(imageId) || imageId.trim() === '') {
      Helpers.error(`Please build first image: ${config.frameworkName} build`, false, true);
    }
    const containtersIds = Helpers.run(`docker ps | grep ${imageId}`, { output: false })
      .sync().toString().trim().split('\n').map(line => {
        const lines = line.split(' ').filter(f => !!f);
        const containerID = _.first(lines);
        return containerID;
      });

    if (containtersIds.length > 0) {
      Helpers.info(`Stoping containters..`);
      try {
        this.run(`docker stop ${containtersIds.join(' ')}`).sync();
        Helpers.info(`Done`);
      } catch (e) {
        Helpers.warn(`Not able to stop containers: ${containtersIds.join(' ')} from image id: ${imageId}`);
      }
    } else {
      Helpers.warn(`No containers to stop by image id: ${imageId}`);
    }

  }


  public set dockerImageId(id: any) {
    Helpers.writeFile(path.join(this.location,
      config.file.tmpDockerImageId), id);
  }

  public get dockerImageId() {
    return Helpers.readFile(path.join(this.location,
      config.file.tmpDockerImageId));
  }
  async buildLib() { }

  startOnCommand() {
    //#region @backendFunc
    this.stop();
    const id = this.dockerImageId;
    if (!_.isString(id) || id.trim() === '') {
      Helpers.error(`Please build first image: ${config.frameworkName} build`, false, true);
    }
    return `docker run ${id} > ./tmp-docker-image-log-${id}.txt 2>&1`;
    //#endregion
  }

  projectSpecyficFiles(): string[] {
    //#region @backendFunc
    return [
      'docker-help.md'
    ];
    //#endregion
  }

  public async saveToFile() {
    Helpers.info(`Exporting image..`);
    this.run(`docker save ${this.dockerImageId} > tmp-container-backup-${this.dockerImageId}.tar`).sync();
  }

  async buildSteps(buildOptions?: BuildOptions) {
    const { nocache } = Helpers.cliTool.argsFrom<{ nocache: boolean; fast: boolean }>(buildOptions.args);
    Helpers.info(`building docker`);
    let dockerImageId: any;

    await this.run(`docker build ${nocache ? '--no-cache' : ''} .`, {
      output: true,
      prefix: 'docker',
      showCommand: true,
      extractFromLine: ['Successfully built', (id) => { dockerImageId = id; }]
    }).asyncAsPromise();
    Helpers.info(`DockerId: ${dockerImageId}`);
    this.dockerImageId = dockerImageId;
  }
}


