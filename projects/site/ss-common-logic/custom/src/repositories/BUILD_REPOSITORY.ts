//#region @backend
import * as fse from 'fs-extra';
import * as path from 'path';
import * as _ from 'lodash';
import { Morphi } from "morphi";
//local
import { BUILD } from "./../entities/BUILD";
import { config, Project, ProjectInstance } from 'tnp-bundle';
export interface BUILD_ALIASES {
  builds: string;
  build: string;
}

@Morphi.Repository(BUILD)
export class BUILD_REPOSITORY extends Morphi.Base.Repository<BUILD, BUILD_ALIASES> {
  globalAliases: (keyof BUILD_ALIASES)[] = ['build', 'builds']



  async getBuilds() {
    console.log('Project', Project)
    const tnpProjectPath = path.join(Project.Tnp.location, config.folder.bin, config.file.projects_json)
    const readjson: any[] = fse.readJSONSync(tnpProjectPath)
    // console.log('readjson', readjson)
    return readjson.map(d => (_.merge(new ProjectInstance, d) as ProjectInstance).project)
  }

}

//#endregion
