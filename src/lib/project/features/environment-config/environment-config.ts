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
import { FeatureForProject } from '../../abstract/feature-for-project';
//#endregion
import { Helpers } from 'tnp-helpers/src';
import { config, ConfigModels } from 'tnp-config/src';
import { Models } from 'tnp-models/src';
//#endregion

export class EnvironmentConfig
  //#region @backend
  extends FeatureForProject
//#endregion
{
  coptyTo(destination: string) {
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
  }

  //#region @backend
  private async updateData(configEn?: Models.env.EnvConfig) {

    if (this.project.git.isGitRepo) {
      if (!configEn && this.project.frameworkVersionAtLeast('v3') && this.project.typeIs('isomorphic-lib')) {
        Helpers.error(`Please build library first: ${config.frameworkName} build:dist`,)
      }
      // console.log('upppp')
      configEn.build = {
        number: this.project.git.countComits(),
        date: this.project.git.lastCommitDate(),
        hash: this.project.git.lastCommitHash(),
        options: {
          isWebsqlBuild: this.project.buildOptions.websql,
          isWatchBuild: this.project.buildOptions.watch,
          outDir: this.project.buildOptions.outDir,
        }
      };
      // console.log('upppp done')
    }
    saveEnvironmentConfig(this.project, configEn);
  }


  public async init(args?: string) {
    const configResult = await standaloneConfigBy(this.project);

    configResult.isCoreProject = this.project.isCoreProject;

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

    configResult.packageJSON = this.project.packageJson.data;

    await this.updateData(configResult);
  }
  //#endregion

   /**
    * @IMPORTANT
   * Can be accesed only after project.env.init()
   */
  public get config(): any {
    //#region @backend
    const configPath = crossPlatformPath([this.project.location, config.file.tnpEnvironment_json]);
    return Helpers.readJson(configPath)
    //#endregion
  }

}
