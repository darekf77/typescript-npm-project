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

export class EnvironmentConfig {

  static woksapaceConfigs = {} as { [workspacePath in string]: EnvConfig; }

  /**
   * Avaliable for worksapce and children
   * Use only for workspace things
   */
  public workspaceConfig: EnvConfig;

  /**
   * Children specyfic config onject
   * available after prepare() for children project
   */
  private config: EnvConfig;

  private kind: 'tnp-workspace' | 'tnp-workspace-child' | 'other' = 'other';


  constructor(private project: Project) {
    this.resolveEnvironmentWorksapceConifg();
  }

  private resolveEnvironmentWorksapceConifg() {
    // console.log('\n\n\nProject: ', this.project && this.project.name, '  location: ', this.project && this.project.location)
    let pathToConfig = ''
    const alreadyExistedWorksapceConfig = (this.project && this.project.parent && this.project.parent.type === 'workspace') ?
      EnvironmentConfig.woksapaceConfigs[this.project.parent.location] : null;

    // console.log('alreadyExistedWorksapceConfig', alreadyExistedWorksapceConfig)

    if (this.project.type === 'workspace') {
      this.kind = 'tnp-workspace';
    }

    if (this.project.parent && this.project.parent.type === 'workspace') {
      this.kind = 'tnp-workspace-child'
    }
    // console.trace('project kind: ', this.kind)
    // console.log('project kind: ', this.kind)

    // console.log('this.project ', this.project.name)
    // console.log('this.project.parent ', this.project.parent ? this.project.parent.name : 'no parent')
    // console.log('this.project.location   ', this.project.location)
    // console.log('this.kind', this.kind)

    if (this.kind !== 'other') {
      // console.log('kind', this.kind)
      // console.log('kind', this.project.name)

      if (_.isObject(alreadyExistedWorksapceConfig) && alreadyExistedWorksapceConfig !== null) {
        this.workspaceConfig = EnvironmentConfig.woksapaceConfigs[this.project.parent.location];
        // console.log('Already exist workspaceconfig ', EnvironmentConfig.woksapaceConfigs)
      } else {

        if (this.kind === 'tnp-workspace-child') {
          let pathToWorkspaceProjectEnvironment = path.join(this.project.parent.location, `environment${globalConfig.env}`);
          // console.log('tnp-workspace-child pathToWorkspaceProjectEnvironment', pathToWorkspaceProjectEnvironment)
          if (fs.existsSync(`${pathToWorkspaceProjectEnvironment}.js`)) {

            pathToConfig = pathToWorkspaceProjectEnvironment;
            try {
              this.workspaceConfig = require(pathToWorkspaceProjectEnvironment) as any;
            } catch (error) {
              if (this.project.isSite) { // QUICK_FIX to get in site child last worksapce changes
                console.log('INIT WORKSPACE CHILD, BUT RECREATE SITE WORKSPACE')
                this.project.parent.join.init() // fix parent for recreating site
              }
              this.workspaceConfig = require(pathToWorkspaceProjectEnvironment) as any;
            }


          } else {
            this.kind = 'other';
          }
        } else if (this.kind === 'tnp-workspace') {
          let pathToProjectEnvironment = path.join(this.project.location, `environment${globalConfig.env}`);
          // console.log('tnp-workspace pathToProjectEnvironment', pathToProjectEnvironment)
          if (fs.existsSync(`${pathToProjectEnvironment}.js`)) {

            pathToConfig = pathToProjectEnvironment;

            try {
              this.workspaceConfig = require(pathToProjectEnvironment) as any;
            } catch (error) {
              if (this.project.isSite) { // QUICK_FIX to get in site child last worksapce changes
                console.log('INIT WORKSPACE , BUT RECREATE IT FIRST')
                this.project.join.init() // fix for recreating site
              }
              this.workspaceConfig = require(pathToProjectEnvironment) as any;
            }



          } else {
            this.kind = 'other';
          }
        }
        if (this.kind !== 'other') {
          this.validateWorkspaceConfig();
        }

      }

    }
    // console.log('workspace config resolve: ', this.workspaceConfig && JSON.stringify(this.workspaceConfig));
    // console.log('Path to worksapce config: ', pathToConfig);
  }



  public async init(optionsOrArgs?: BuildOptions | string) {
    this.resolveEnvironmentWorksapceConifg()
    if (this.project.type === 'workspace' || this.project.isWorkspaceChildProject) {
      let args: string;
      if (_.isString(optionsOrArgs)) {
        args = optionsOrArgs;
      }
      await this.overrideDefaultPortsAndWorkspaceConfig(args)
    }
    if (this.project.type === 'workspace') {
      // console.log(`No need to prepare workspace config`)
      return
    }
    const staticStartMode = _.isString(optionsOrArgs);
    // console.log('proxyRouterMode', proxyRouterMode)
    // console.log('this.kind in prepare', this.kind)
    if (!!this.config) {
      return
    }

    if (this.kind === 'other') {
      return
    }
    if (staticStartMode) {
      optionsOrArgs = this.options.saved as BuildOptions; // change args to saved options
      if (optionsOrArgs.watch) {
        error(`Please run ${chalk.bold('tnp build:app')} before start:app command`);
      }
    }

    optionsOrArgs = optionsOrArgs as BuildOptions;

    const { appBuild, prod, watch = false, environmentName } = optionsOrArgs;
    this.options.save(optionsOrArgs)

    // console.log('PREPARE options', options)
    this.config = _.cloneDeep(this.workspaceConfig);
    this.config.proxyRouterMode = (
      !optionsOrArgs.watch &&
      this.project.parent &&
      this.project.parent.type === 'workspace'
    );
    this.config.name = (!this.config.name) ? (environmentName ? environmentName : 'local') : this.config.name;
    this.config.isCoreProject = this.project.isCoreProject;

    if (!this.config.workspace || !this.config.workspace.workspace) {
      error(`You shoud define 'workspace' object inside config.workspace object`, true)
      this.err()
    }
    if (!this.config.ip) {
      this.config.ip = 'localhost'
    } else {
      if (!isValidIp(this.config.ip)) {
        error(`Bad ip address in your environment .json config`)
      }
    }

    this.config.workspace.workspace.hostSocket = `http://${this.config.ip}:${this.config.workspace.workspace.port}`;

    if (this.config.domain) {
      this.config.workspace.workspace.host =
        `${this.config.domain}${this.config.workspace.workspace.baseUrl}`;
    } else {
      this.config.workspace.workspace.host =
        `http://${this.config.ip}:${this.config.workspace.workspace.port}`;
    }


    if (this.kind === 'tnp-workspace') {
      this.config.packageJSON = this.project.packageJson.data;
    }

    if (this.kind === 'tnp-workspace-child') {
      this.config.packageJSON = this.project.parent.packageJson.data;
    }

    this.config.workspace.projects.forEach(p => {

      p.hostSocket = `http://${this.config.ip}:${p.port}`;

      if (this.config.domain || this.config.proxyRouterMode) {
        p.host = `${this.config.workspace.workspace.host}${p.baseUrl}`;
      } else {
        p.host = `http://${this.config.ip}:${p.port}`;
      }
    })

    this.saveConfig()
    // console.log('config prepared!', this.config)

  }

  /**
   * Can be accesed only after env.prepare()
   */
  public get configFor() {
    if (this.project.type === 'workspace') {
      error(`Do not use ${chalk.bold('env.configFor.backend, env.configFor.frontend')} from worksapce level...`, true)
      error(`Try ${chalk.bold('env.workspaceConfig')} ...`)
    }
    const self = this;
    return {
      get backend() {
        return self.config;
      },
      get frontend() {
        const c = _.cloneDeep(self.configFor.backend);
        walkObject(c, (lodashPath, isPrefixed) => {
          if (isPrefixed) {
            _.set(c, lodashPath, null)
          }
        })
        return c;
      }
    }
  }

  private get workspaceProjectLocation() {
    if (this.kind === 'tnp-workspace') {
      return this.project.location;
    } else if (this.kind === 'tnp-workspace-child') {
      return this.project.parent.location;
    }
  }

  private async overrideWorksapceRouterPort(allIpsGeneratedDynamicly: boolean = false) {
    if (this.workspaceConfig.workspace && this.workspaceConfig.workspace.workspace) {
      const p = ProjectFrom(this.workspaceProjectLocation)
      if (p) {
        if (allIpsGeneratedDynamicly) {
          const port = await ProxyRouter.getFreePort();
          console.log(`Overrided/Generated port from ${p.getDefaultPort()} to ${port} in project: ${p.name}`)
          p.setDefaultPort(port);
          this.workspaceConfig.workspace.workspace.port = port;
        } else {
          const port = Number(this.workspaceConfig.workspace.workspace.port);
          if (!isNaN(port)) {
            console.log(`Overrided port from ${p.getDefaultPort()} to ${port} in project: ${p.name}`)
            p.setDefaultPort(port)
          }
        }
      }
    } else {
      warn(`Router (worksapce) port is not defined in your environment.js `);
    }

  }

  private environmentWithGeneratedIps: EnvironmentName[] = ['prod', 'stage'];
  private async overrideDefaultPortsAndWorkspaceConfig(args: string) {

    let saveNewWorkspaceConfig = false;
    let allIpsGeneratedDynamicly = false;
    if (_.isString(args)) {
      let { env, generateIps }: { env: EnvironmentName, generateIps: boolean } = require('minimist')(args.split(' '));

      if (allowedEnvironments.includes(env)) {
        saveNewWorkspaceConfig = true;
        this.workspaceConfig.name = env;
      }

      console.log(`typeof generateIps`, typeof generateIps)
      allIpsGeneratedDynamicly = (this.environmentWithGeneratedIps.includes(env)) || generateIps;
      if (allIpsGeneratedDynamicly) {
        saveNewWorkspaceConfig = true;
      }
    }

    // console.log(this.workspaceConfig)
    await this.overrideWorksapceRouterPort(allIpsGeneratedDynamicly)

    const overridedProjectsName: string[] = []
    this.workspaceConfig.workspace.workspace.port

    for (let i = 0; i < this.workspaceConfig.workspace.projects.length; i++) {
      const d = this.workspaceConfig.workspace.projects[i];
      let port = Number(d.port);
      if (!_.isNaN(port)) {
        const p = ProjectFrom(path.join(this.workspaceProjectLocation, d.name))
        if (p === undefined) {
          error(`Undefined project: ${d.name} inside environment.js workpace.projects`);
        } else {
          overridedProjectsName.push(d.name)
          if (allIpsGeneratedDynamicly) {
            port = await ProxyRouter.getFreePort();
            console.log(`Overrided/Generated port from ${p.getDefaultPort()} to ${port} in project: ${p.name}`)
            p.setDefaultPort(port);
            d.port = port;
          } else {
            console.log(`Overrided port from ${p.getDefaultPort()} to ${port} in project: ${p.name}`)
            p.setDefaultPort(port);
          }

        }
      }
    }

    const workspace = ProjectFrom(this.workspaceProjectLocation)
    workspace.children.forEach(childProject => {
      if (!overridedProjectsName.includes(childProject.name)) {
        childProject.setDefaultPortByType()
      }
    })

    if (saveNewWorkspaceConfig) {
      this.saveConfig()
    }

  }

  private schema: EnvConfig = {
    workspace: {
      workspace: {
        baseUrl: '/info',
        name: 'workspace-name',
        port: 5000
      },
      projects: [
        {
          baseUrl: '/some-api-endpoint',
          name: 'project-name-in-workspace',
          port: 3000
        },
        {
          baseUrl: '/',
          name: 'other-example-projet-name',
          port: 4000
        }
      ]
    }
  }

  private err() {
    error(`Please follow worksapce schema:\n${chalk.bold(JSON.stringify(this.schema, null, 4))}
    \n
    \n your config\n : ${JSON.stringify(this.workspaceConfig, null, 4)}
        `)
  }

  private validateWorkspaceConfig() {

    if (!_.isObject(_.get(this.workspaceConfig, 'workspace'))) this.err();
    if (!_.isArray(_.get(this.workspaceConfig, 'workspace.projects'))) this.err()
    this.workspaceConfig.workspace.projects.forEach(p => {
      if (_.isUndefined(p.name)) this.err()
      if (_.isUndefined(p.port)) this.err()
      if (_.isUndefined(p.baseUrl)) this.err()
    });

    if (_.isUndefined(_.get(this.workspaceConfig, 'workspace.build'))) {
      this.workspaceConfig.workspace.build = {
        browser: {
          aot: false,
          minify: false,
          production: false
        },
        server: {
          minify: false,
          production: false
        }
      }
    }
    if (!_.isObject(_.get(this.workspaceConfig, 'workspace.build'))) {
      this.err()
    }

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





  private saveConfig() {
    const tmpEnvironmentFileName = 'tmp-environment.json';
    const tmpEnvironmentPath = path.join(this.project.location, tmpEnvironmentFileName)
    if (this.project.type === 'angular-client' || this.project.type === 'angular-lib') {
      fse.writeFileSync(tmpEnvironmentPath, JSON.stringify(this.configFor.frontend, null, 4), {
        encoding: 'utf8'
      })
    } else if (this.project.type === 'isomorphic-lib') {
      fse.writeFileSync(tmpEnvironmentPath, JSON.stringify(this.configFor.backend, null, 4), {
        encoding: 'utf8'
      })
    }
    // console.log(`Config saved in ${tmpEnvironmentPath}`)
  }





}
//#endregion
