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

  get isChildProjectWithoutConfig() {
    const f = path.join(this.project.location, tmpEnvironmentFileName);
    return !fse.existsSync(f);
  }

  public async init(args?: string, overridePortsOnly = false) {
    let workspaceProjectLocation: string;

    if (this.project.isWorkspace) {
      workspaceProjectLocation = path.join(this.project.location);
    } else if (this.project.isWorkspaceChildProject) {
      workspaceProjectLocation = path.join(this.project.parent.location);
    } else {
      return;
    }

    if (this.project.isWorkspaceChildProject && this.isChildProjectWithoutConfig) {
      await this.project.parent.env.init(args, overridePortsOnly);
    }

    if (this.project.isWorkspaceChildProject) {
      await overrideWorksapceRouterPort({ workspaceProjectLocation, workspaceConfig: this.config }, false)
      await overrideDefaultPortsAndWorkspaceConfig({ workspaceProjectLocation, workspaceConfig: this.config }, false);
    }

    if (!this.project.isWorkspace) {
      return
    }

    const { generateIps, env }: { generateIps: boolean, env: EnvironmentName } =
      _.isString(args) ? require('minimist')(args.split(' ')) : { generateIps: false };

    const environmentName = (_.isString(env) && env.trim() !== '') ? env : 'local'

    const config = workspaceConfigBy(this.project, environmentName);
    config.name = environmentName;

    config.dynamicGenIps = (environmentWithGeneratedIps.includes(config.name)) || generateIps;

    await overrideWorksapceRouterPort({ workspaceProjectLocation, workspaceConfig: config })
    await overrideDefaultPortsAndWorkspaceConfig({ workspaceProjectLocation, workspaceConfig: config });

    if (overridePortsOnly) {
      console.log('Only ports overriding.. ')
      return
    }

    config.isCoreProject = this.project.isCoreProject;

    if (!config.workspace || !config.workspace.workspace) {
      error(`You shoud define 'workspace' object inside config.workspace object`, true)
      err(config)
    }
    if (!config.ip) {
      config.ip = 'localhost'
    } else {
      if (_.isString(config.ip)) {
        config.ip = config.ip.replace(/^https?:\/\//, '');
      }
      if (!isValidIp(config.ip)) {
        error(`Bad ip address in your environment .json config`, true)
        err(config)
      }
    }

    if (_.isString(config.domain)) {
      config.domain = config.domain.replace(/\/$/, '');
      config.domain = config.domain.replace(/^https?:\/\//, '');
    }

    config.workspace.workspace.hostSocket = `http://${config.ip}:${config.workspace.workspace.port}`;

    if (config.name === 'local' || !config.domain) {
      config.workspace.workspace.host =
        `http://${config.ip}:${config.workspace.workspace.port}`;
    } else {
      const workspaceBaseUrl = _.isString(config.workspace.workspace.baseUrl) ? config.workspace.workspace.baseUrl : ''
      config.workspace.workspace.host =
        `https://${config.domain}${workspaceBaseUrl}`;
    }

    config.workspace.workspace.host = config.workspace.workspace.host.replace(/\/$/, '');

    config.packageJSON = this.project.packageJson.data;

    config.workspace.projects.forEach(p => {

      p.hostSocket = `http://${config.ip}:${p.port}`;

      if (config.name === 'local') {
        p.host = `http://${config.ip}:${p.port}`;
      } else {
        p.host = `${config.workspace.workspace.host}${p.baseUrl}`;
      }

    })

    saveConfigWorkspca(this.project, config)
  }

  private static configs: { [location: string]: EnvConfig } = {};

  /**
   * Can be accesed only after env.prepare()
   */
  public get config(): EnvConfig {

    const configPath = path.resolve(path.join(this.project.location, tmpEnvironmentFileName));
    if (EnvironmentConfig.configs[configPath]) {
      return EnvironmentConfig.configs[configPath];
    }
    if (fse.existsSync(configPath)) {
      const res = fse.readJsonSync(configPath) as EnvConfig;
      EnvironmentConfig.configs[configPath] = res;
      return res;
    } else {
      warn(`confg doesnt exist: ${configPath}`)
    }

  }






}




//#endregion
