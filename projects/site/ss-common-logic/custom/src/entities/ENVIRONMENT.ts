import { Entity, META, DefaultModelWithMapping, PrimaryGeneratedColumn } from "morphi";
import * as _ from 'lodash';
import {
  EnvironmentName, config, EnvConfig, EnvConfigProject, IPackageJSON
} from "tnp-bundle";
import { CLASSNAME, FormlyForm } from "morphi";
import { TNP_PROJECT } from "./TNP_PROJECT";

//#region @backend
import * as fse from 'fs-extra';
import * as path from 'path';
import * as glob from 'glob';
//#endregion

export interface IENVIRONMENT {

}


//#region @backend
@Entity(META.tableNameFrom(ENVIRONMENT))
//#endregion
@FormlyForm<ENVIRONMENT>()
@DefaultModelWithMapping<ENVIRONMENT>({

}, {

  })
@CLASSNAME('ENVIRONMENT')
export class ENVIRONMENT extends META.BASE_ENTITY<ENVIRONMENT> implements EnvConfig {
  pathes?: any;
  isCoreProject?: boolean;
  isSiteProject?: boolean;
  domain?: string;
  dynamicGenIps?: boolean;
  ip?: string;
  workspace: {
    workspace: EnvConfigProject;
    build?: {
      browser: {
        minify: boolean;
        aot: boolean;
        production: boolean;
      };
      server: {
        minify: boolean;
        production: boolean;
      };
    };
    projects: EnvConfigProject[];
  }
  currentProjectName?: string;
  packageJSON?: IPackageJSON;

  fromRaw(obj: IENVIRONMENT): ENVIRONMENT {
    return _.merge(new ENVIRONMENT(), obj);
  }

  static fromRaw(obj: IENVIRONMENT): ENVIRONMENT {
    return _.merge(new ENVIRONMENT(), obj);
  }

  name: EnvironmentName;


  static from(project: TNP_PROJECT) {
    //#region @backendFunc
    if (!project) {
      return;
    }
    const json = fse.readJsonSync(path.join(project.location, config.file.tnpEnvironment_json));
    if (json) {
      return ENVIRONMENT.fromRaw(json);
    }
    //#endregion
  }


  static namesFrom(project: TNP_PROJECT): EnvironmentName[] {
    //#region @backendFunc
    if (!project) {
      return;
    }

    const patter = `${project.location}/${config.file.environment}.*`;
    let names = glob
      .sync(patter)
      .filter(f => f.split('.').pop() === 'js')
      .map(f => path
        .basename(f)
        .replace(`${config.file.environment}.`, '')
        .replace(/\.?js$/, '')
      )
      .map(f => f.trim() === '' ? 'local' : f);

    return names as any;
    //#endregion
  }


  @PrimaryGeneratedColumn()
  id: number;


}
