//#region imports
//#region @backend
import { crossPlatformPath, fse } from 'tnp-core'
import { path } from 'tnp-core'
import { _ } from 'tnp-core';
import {
  handleError,
  saveConfigWorkspca as saveEnvironmentConfig,
  standaloneConfigBy
} from './environment-config-helpers';
import { FeatureForProject } from '../../abstract';
//#endregion
import { Helpers } from 'tnp-helpers';
import { config, ConfigModels } from 'tnp-config';
import { Models } from 'tnp-models';
//#endregion

export class EnvironmentConfig
  //#region @backend
  extends FeatureForProject
//#endregion
{
  coptyTo(destination: string) {
    const source = path.join(this.project.location, config.file.environment_js);
    const dest = path.join(destination, config.file.environment_js);
    Helpers.copyFile(source, dest);
  }

  //#region @backend
  private async updateData(configEn?: Models.env.EnvConfig) {
    if (this.project.isStandaloneProject && this.project.isGenerated) {
      return;
    }

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
    if (this.project.isStandaloneProject && this.project.isGenerated) {
      return;
    }
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
   * Can be accesed only after env.prepare()
   */
  public get config(): any{
    //#region @backend
    const configPath = crossPlatformPath([this.project.location, config.file.tnpEnvironment_json]);
    return Helpers.readJson(configPath)
    //#endregion
  }

}
