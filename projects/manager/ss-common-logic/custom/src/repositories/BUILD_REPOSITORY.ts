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



}

//#endregion
