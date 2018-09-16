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
import { validateWorkspaceConfig, err, overrideDefaultPortsAndWorkspaceConfig, saveConfigFor, tmpEnvironmentFileName } from './environment-config-helpers';


export class EnvironmentConfig {

  private static woksapaceConfigs = {} as { [workspacePath in string]: EnvConfig; }

  constructor(private project: Project) { }


  /**
     * Avaliable for worksapce and children
     * Use only for workspace things
     */
  private get workspaceConfig(): EnvConfig {
    let workspaceConfig: EnvConfig;

    // console.log('\n\n\nProject: ', this.project && this.project.name, '  location: ', this.project && this.project.location)
    let pathToConfig = ''
    const alreadyExistedWorksapceConfig = (this.project && this.project.parent && this.project.parent.type === 'workspace') ?
      EnvironmentConfig.woksapaceConfigs[this.project.parent.location] : null;

    // console.log('alreadyExistedWorksapceConfig', alreadyExistedWorksapceConfig)


    if (this.project.isWorkspace || this.project.isWorkspaceChildProject) {

      if (_.isObject(alreadyExistedWorksapceConfig) && alreadyExistedWorksapceConfig !== null) {
        workspaceConfig = EnvironmentConfig.woksapaceConfigs[this.project.parent.location];
        // console.log('Already exist workspaceconfig ', EnvironmentConfig.woksapaceConfigs)
      } else {

        if (this.project.isWorkspaceChildProject) {
          let pathToWorkspaceProjectEnvironment = path.join(this.project.parent.location, `environment${globalConfig.env}`);
          // console.log('tnp-workspace-child pathToWorkspaceProjectEnvironment', pathToWorkspaceProjectEnvironment)
          if (fs.existsSync(`${pathToWorkspaceProjectEnvironment}.js`)) {

            pathToConfig = pathToWorkspaceProjectEnvironment;
            try {
              workspaceConfig = require(pathToWorkspaceProjectEnvironment) as any;
            } catch (error) {
              if (this.project.isSite) { // QUICK_FIX to get in site child last worksapce changes
                console.log('INIT WORKSPACE CHILD, BUT RECREATE SITE WORKSPACE')
                this.project.parent.join.init() // fix parent for recreating site
              }
              workspaceConfig = require(pathToWorkspaceProjectEnvironment) as any;
            }


          }
        } else if (this.project.isWorkspace) {
          let pathToProjectEnvironment = path.join(this.project.location, `environment${globalConfig.env}`);
          // console.log('tnp-workspace pathToProjectEnvironment', pathToProjectEnvironment)
          if (fs.existsSync(`${pathToProjectEnvironment}.js`)) {

            pathToConfig = pathToProjectEnvironment;

            try {
              workspaceConfig = require(pathToProjectEnvironment) as any;
            } catch (error) {
              if (this.project.isSite) { // QUICK_FIX to get in site child last worksapce changes
                console.log('INIT WORKSPACE , BUT RECREATE IT FIRST')
                this.project.join.init() // fix for recreating site
              }
              workspaceConfig = require(pathToProjectEnvironment) as any;
            }

          }
        }
      }
      validateWorkspaceConfig(workspaceConfig);
    }
    // console.log('workspace config resolve: ', this.workspaceConfig && JSON.stringify(this.workspaceConfig));
    // console.log('Path to worksapce config: ', pathToConfig);
    return workspaceConfig;
  }

 /// TODO remove children config links

  public async init(optionsOrArgs?: BuildOptions | string) {
    if (!this.project.isWorkspace) {
      return
    }

    let config = this.workspaceConfig;
    const workspaceProjectLocation = path.join(this.project.location)

    if (this.project.isWorkspace || this.project.isWorkspaceChildProject) {
      let args: string;
      if (_.isString(optionsOrArgs)) {
        args = optionsOrArgs;
      }
      await overrideDefaultPortsAndWorkspaceConfig(workspaceProjectLocation, config, args);
    }

    const staticStartMode = _.isString(optionsOrArgs);

    if (staticStartMode) {
      optionsOrArgs = this.options.saved as BuildOptions; // change args to saved options
      if (optionsOrArgs.watch) {
        error(`Please run ${chalk.bold('tnp build:app')} before start:app command`);
      }
    }

    optionsOrArgs = optionsOrArgs as BuildOptions;

    const { appBuild, prod, watch = false, environmentName } = optionsOrArgs;
    this.options.save(optionsOrArgs)


    config.proxyRouterMode = (
      !optionsOrArgs.watch &&
      this.project.parent &&
      this.project.parent.type === 'workspace'
    );
    config.name = (!config.name) ? (environmentName ? environmentName : 'local') : config.name;
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

    saveConfigFor(this.project, config)
    // console.log('config prepared!', this.config)

  }

  /**
   * Can be accesed only after env.prepare()
   */
  public get config() {
    const configLocation = (this.project.isWorkspaceChildProject ?
      this.project.parent.location : this.project.location, tmpEnvironmentFileName);

    return fse.readJsonSync(configLocation, {
      encoding: 'utf8'
    });
  }




  private get options() {
    const filename = 'tmp-env-prepare.json';
    const pathTmpEnvPrepareOptions = path.join(this.project.location, filename);
    const self = this;
    return {
      get saved() {
        if (!fs.existsSync(pathTmpEnvPrepareOptions)) {
          error(`Please run: tnp build:app`)
        }
        return fse.readJSONSync(pathTmpEnvPrepareOptions)
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

