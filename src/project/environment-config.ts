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
    let workspaceProjectLocation: string;

    if (this.project.isWorkspace) {
      workspaceProjectLocation = path.join(this.project.location);
    } else if (this.project.isWorkspaceChildProject) {
      workspaceProjectLocation = path.join(this.project.parent.location);
    } else {
      return;
    }

    if (this.project.isWorkspaceChildProject && this.isChildProjectWithoutConfig) {
      await this.project.parent.env.init(optionsOrArgs);
    }

    if (this.project.isWorkspaceChildProject) {
      await overrideWorksapceRouterPort({ workspaceProjectLocation, workspaceConfig: this.config }, false)
      await overrideDefaultPortsAndWorkspaceConfig({ workspaceProjectLocation, workspaceConfig: this.config }, false);
    }

    if (!this.project.isWorkspace) {
      return
    }
    this.removeChildsConfig();

    let config = workspaceConfigBy(this.project, globalConfig.environmentName);



    let args: string;
    if (_.isString(optionsOrArgs)) {
      args = optionsOrArgs;
    }

    config.proxyRouterMode = _.isString(optionsOrArgs);

    const { environmentName } = config.proxyRouterMode ? {} as any : optionsOrArgs;

    config.name = (!environmentName ? 'local' : environmentName);

    let { generateIps, env }: { generateIps: boolean, env: EnvironmentName } =
      _.isString(args) ? require('minimist')(args.split(' ')) : { generateIps: false };
    config.name = (_.isString(env) && env.trim() !== '') ? env : config.name;

    config.dynamicGenIps = (environmentWithGeneratedIps.includes(config.name)) || generateIps;

    await overrideWorksapceRouterPort({ workspaceProjectLocation, workspaceConfig: config })
    await overrideDefaultPortsAndWorkspaceConfig({ workspaceProjectLocation, workspaceConfig: config });

    config.isCoreProject = this.project.isCoreProject;

    if (!config.workspace || !config.workspace.workspace) {
      error(`You shoud define 'workspace' object inside config.workspace object`, true)
      err(config)
    }
    if (!config.ip) {
      config.ip = 'localhost'
    } else {
      if (!isValidIp(config.ip)) {
        error(`Bad ip address in your environment .json config`, true)
        err(config)
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
  public get config(): EnvConfig {
    const configLocation = (
      this.project.isWorkspaceChildProject ? this.project.parent.location : this.project.location,
      tmpEnvironmentFileName);

    const configPath = path.join(this.project.location, configLocation);
    if (fse.existsSync(configPath)) {
      const res = fse.readJsonSync(configPath) as EnvConfig;
      return res;
    }

  }






}




//#endregion
