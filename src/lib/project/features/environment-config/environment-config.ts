//#region imports
//#region @backend
import { crossPlatformPath, fse } from 'tnp-core/src'
import { path } from 'tnp-core/src'
import { _ } from 'tnp-core/src';
import {
  handleError,
  saveConfigWorkspca as saveEnvironmentConfig,
  standaloneConfigBy
} from './environment-config-helpers';
//#endregion
import { BaseFeatureForProject } from 'tnp-helpers/src';
import { Helpers } from 'tnp-helpers/src';
import { config } from 'tnp-config/src';
import type { Project } from '../../../project/abstract/project';
import { Models } from '../../../models';
//#endregion

export class EnvironmentConfig
  //#region @backend
  extends BaseFeatureForProject<Project>
//#endregion
{
  //#region methods & getters / copy to
  coptyTo(destination: string) {
    //#region @backend
    (() => {
      const source = path.join(this.project.location, config.file.environment_js);
      const dest = path.join(destination, config.file.environment_js);
      Helpers.copyFile(source, dest);
    })();
    (() => {
      const source = path.join(this.project.location, config.file.tnpEnvironment_json);
      const dest = path.join(destination, config.file.tnpEnvironment_json);
      Helpers.copyFile(source, dest);
    })();
    //#endregion
  }
  //#endregion

  //#region @backend
  private async updateData(configEn?: Models.EnvConfig) {

    if (this.project.git.isInsideGitRepo) {
      if (!configEn && this.project.__frameworkVersionAtLeast('v3') && this.project.typeIs('isomorphic-lib')) {
        Helpers.error(`Please build library first: ${config.frameworkName} build:dist`,)
      }
      // console.log('upppp')
      configEn.build = {
        number: this.project.git.countComits(),
        date: this.project.git.lastCommitDate(),
        hash: this.project.git.lastCommitHash(),
      };
      // console.log('upppp done')
    }
    saveEnvironmentConfig(this.project, configEn);
  }


  public async init() {
    const configResult = await standaloneConfigBy(this.project);

    configResult.isCoreProject = this.project.__isCoreProject;

    if (!configResult.ip) {
      configResult.ip = 'localhost'
    } else {
      if (_.isString(configResult.ip)) {
        configResult.ip = configResult.ip.replace(/^https?:\/\//, '');
      }
      if (!Helpers.isValidIp(configResult.ip)) {
        Helpers.error(`Bad ip address in your environment .json config`, true)
        handleError(configResult, void 0, this.project.location);
      }
    }

    if (_.isString(configResult.domain)) {
      configResult.domain = configResult.domain.replace(/\/$/, '');
      configResult.domain = configResult.domain.replace(/^https?:\/\//, '');
    }

    configResult.packageJSON = this.project.__packageJson.data;

    await this.updateData(configResult);
  }
  //#endregion

  //#region methods & getters / config
  /**
   * @IMPORTANT
  * Can be accesed only after project.env.init()
  */
  public get config(): any {
    //#region @backendFunc
    const configPath = crossPlatformPath([this.project.location, config.file.tnpEnvironment_json]);
    return Helpers.readJson(configPath)
    //#endregion
  }
  //#endregion

}
