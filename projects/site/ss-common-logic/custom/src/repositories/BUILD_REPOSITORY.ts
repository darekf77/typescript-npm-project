//#region @backend
import { EntityRepository, META, ModelDataConfig, PathParam } from "morphi";
import { BUILD } from "./../entities/BUILD";
import * as fse from 'fs-extra';
import * as _ from 'lodash';
import { run, HelpersLinks, killProcess, pullCurrentBranch, EnvironmentName } from 'tnp-bundle';
import * as child from 'child_process';
import { PROGRESS_BAR_DATA, ProjectFrom } from "tnp-bundle";
import { TNP_PROJECT } from "../entities/TNP_PROJECT";

export interface BUILD_ALIASES {
  builds: string;
  build: string;
}

@EntityRepository(BUILD)
export class BUILD_REPOSITORY extends META.BASE_REPOSITORY<BUILD, BUILD_ALIASES> {
  globalAliases: (keyof BUILD_ALIASES)[] = ['build', 'builds']

  recreateFolders() {

    if (!fse.existsSync(ENV.pathes.backup.repositories)) {
      fse.mkdirpSync(ENV.pathes.backup.repositories)
    }

    if (!fse.existsSync(ENV.pathes.backup.builds)) {
      fse.mkdirpSync(ENV.pathes.backup.builds)
    }
  }

  async getById(id: number) {
    const config = new ModelDataConfig({
      joins: ['project', 'project.children']
    });
    const build = await this.findOne({
      where: { id },
      join: config && config.db && config.db.join
    });

    if (!build) {
      throw `Cannot find build with id ${id}`
    }
    return build;
  }

  async changeEnvironmentBy(idOrBuild: number | BUILD, @PathParam('envname') envname: EnvironmentName = 'dev') {
    let build = _.isNumber(idOrBuild) ? await this.getById(idOrBuild) : idOrBuild;
    if (build.pidChangeEnvProces) {
      throw 'changing environment process alredy in progress'
    }
    console.log(`start changeing environment to ${envname}`)
    const p = build.project.run(`tnp clear --onlyWorkspace && tnp init --env ${envname}`, {
      output: false
    }).async();
    p.once('exit', async () => {
      build = await this.getById(build.id)
      build.pidChangeEnvProces = undefined;
      build.environmentName = envname;
      console.log(`end changeing environment to ${envname}`)
      await this.updateRealtime(build.id, build)
    })
    build.pidChangeEnvProces = p.pid;
    await this.update(build.id, build)
  }


}

//#endregion
