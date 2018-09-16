//#region @backend
import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as _ from 'lodash';

import { Project } from './base-project';
import { EnvConfig, BuildOptions, EnvironmentName } from '../models';
import { walkObject } from '../helpers';
import { error, warn } from '../messages';
import chalk from 'chalk';
import { ProjectFrom } from './index';
import { isValidIp } from '../helpers-environment';
import globalConfig, { allowedEnvironments } from '../config';
import { ProxyRouter } from './proxy-router';
import {
  validateWorkspaceConfig, err, overrideDefaultPortsAndWorkspaceConfig, saveConfigWorkspca, tmpEnvironmentFileName, workspaceConfigBy, overrideWorksapceRouterPort
} from './environment-config-helpers';

const environmentWithGeneratedIps: EnvironmentName[] = ['prod', 'stage'];

export class EnvironmentConfig {



  constructor(private project: Project) { }


  /**
     * Avaliable for worksapce and children
     * Use only for workspace things
     */


  /// TODO remove children config links

  private removeChildsConfig() {
    this.project.children.forEach(p => {
      const f = path.join(p.location, tmpEnvironmentFileName);
      if (fse.existsSync(f)) {
        fse.unlinkSync(f);
      }
    })
  }

  get isChildProjectWithoutConfig() {
    const f = path.join(this.project.location, tmpEnvironmentFileName);
    return !fse.existsSync(f);
  }

  public async init(optionsOrArgs?: BuildOptions | string) {
    // console.log('INIT ENV CALLELD !!!,', optionsOrArgs)
    // console.log(`PROJECT: ${this.project.name}  this.project.isWorkspaceChildProjec `, this.project.isWorkspaceChildProject)
    // console.log(`PROJECT: ${this.project.name}  this.isChildProjectWithoutConfig `, this.isChildProjectWithoutConfig)
    if (this.project.isWorkspaceChildProject && this.isChildProjectWithoutConfig) {
      await this.project.parent.env.init(optionsOrArgs);
      return
    }
    if (!this.project.isWorkspace) {
      return
    }
    this.removeChildsConfig();

    let config = workspaceConfigBy(this.project, globalConfig.environmentName);
    const workspaceProjectLocation = path.join(this.project.location)


    let args: string;
    if (_.isString(optionsOrArgs)) {
      args = optionsOrArgs;
    }

    config.proxyRouterMode = _.isString(optionsOrArgs);

    if (config.proxyRouterMode) {
      optionsOrArgs = this.options.saved as BuildOptions; // change args to saved options
    }
    optionsOrArgs = optionsOrArgs as BuildOptions;
    config.buildOptions = optionsOrArgs;
    this.options.save(optionsOrArgs)

    const { environmentName } = optionsOrArgs;
    config.name = (!environmentName ? 'local' : environmentName);

    const env: EnvironmentName = config.name;
    const { generateIps }: { generateIps: boolean } =
      _.isString(args) ? require('minimist')(args.split(' ')) : { generateIps: false };
    config.dynamicGenIps = (environmentWithGeneratedIps.includes(env)) || generateIps;

    await overrideWorksapceRouterPort(workspaceProjectLocation, config)
    await overrideDefaultPortsAndWorkspaceConfig(workspaceProjectLocation, config);

    config.isCoreProject = this.project.isCoreProject;

    if (!config.workspace || !config.workspace.workspace) {
      error(`You shoud define 'workspace' object inside config.workspace object`, true)
      err(config)
    }
    if (!config.ip) {
      config.ip = 'localhost'
    } else {
      if (!isValidIp(config.ip)) {
        error(`Bad ip address in your environment .json config`)
      }
    }

    config.workspace.workspace.hostSocket = `http://${config.ip}:${config.workspace.workspace.port}`;

    if (config.domain) {
      config.workspace.workspace.host =
        `${config.domain}${config.workspace.workspace.baseUrl}`;
    } else {
      config.workspace.workspace.host =
        `http://${config.ip}:${config.workspace.workspace.port}`;
    }

    config.packageJSON = this.project.packageJson.data;

    config.workspace.projects.forEach(p => {

      p.hostSocket = `http://${config.ip}:${p.port}`;

      if (config.domain || config.proxyRouterMode) {
        p.host = `${config.workspace.workspace.host}${p.baseUrl}`;
      } else {
        p.host = `http://${config.ip}:${p.port}`;
      }
    })

    saveConfigWorkspca(this.project, config)
  }

  /**
   * Can be accesed only after env.prepare()
   */
  public get config() {
    const configLocation = (
      this.project.isWorkspaceChildProject ? this.project.parent.location : this.project.location,
      tmpEnvironmentFileName);

    const configPath = path.join(this.project.location, configLocation);
    return fse.readJsonSync(configPath);
  }




  private get options() {
    const filename = 'tmp-env-prepare.json';
    const pathTmpEnvPrepareOptions = path.join(this.project.location, filename);
    // const self = this;
    return {
      get saved() {
        if (!fs.existsSync(pathTmpEnvPrepareOptions)) {
          error(`Please run: tnp build:app`)
        }
        return BuildOptions.fromRaw(fse.readJSONSync(pathTmpEnvPrepareOptions))
      },
      save(options: BuildOptions) {
        // console.log(`Prepare OPTIONS saved in ${pathTmpEnvPrepareOptions}`)
        fse.writeJSONSync(pathTmpEnvPrepareOptions, options, {
          spaces: 2
        })
      }
    }
  }


}




//#endregion
