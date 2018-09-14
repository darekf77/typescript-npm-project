import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as _ from 'lodash';

import { Project } from './base-project';
import { EnvConfig, BuildOptions, EnvironmentName } from '../models';
import { walkObject } from '../helpers';
import { error } from '../messages';
import chalk from 'chalk';
import { ProjectFrom } from './index';
import { isValidIp } from '../helpers-environment';
import globalConfig from '../config';

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



  public init(options?: BuildOptions) {
    this.resolveEnvironmentWorksapceConifg()
    if (this.project.type === 'workspace' || this.project.isWorkspaceChildProject) {
      this.overrideDefaultPorts()
    }
    if (this.project.type === 'workspace') {
      // console.log(`No need to prepare workspace config`)
      return
    }
    const staticStartMode = !options;
    // console.log('proxyRouterMode', proxyRouterMode)
    // console.log('this.kind in prepare', this.kind)
    if (!!this.config) {
      return
    }

    if (this.kind === 'other') {
      return
    }
    if (staticStartMode) {
      options = this.options.saved;
      if (options.watch) {
        error(`Please run ${chalk.bold('tnp build:app')} before start:app command`);
      }
    }
    const { appBuild, prod, watch = false, environmentName } = options;
    this.options.save(options)

    // console.log('PREPARE options', options)
    this.config = _.cloneDeep(this.workspaceConfig);
    this.config.proxyRouterMode = (
      !options.watch &&
      this.project.parent &&
      this.project.parent.type === 'workspace'
    );
    this.config.name = environmentName ? environmentName : 'local';
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

  private overrideDefaultPorts() {

    // console.log(this.workspaceConfig)

    const overridedProjectsName: string[] = []
    this.workspaceConfig.workspace.projects.forEach(d => {
      const port = Number(d.port);
      if (!_.isNaN(port)) {
        const p = ProjectFrom(path.join(this.workspaceProjectLocation, d.name))
        if (p === undefined) {
          error(`Undefined project: ${d.name} inside environment.js workpace.projects`);
        } else {

          console.log(`Overrided port from ${p.getDefaultPort()} to ${port} in project: ${p.name}`)
          overridedProjectsName.push(d.name)
          p.setDefaultPort(port);
        }
      }
    })
    // console.log('OWEVERRIDINGINGIGNIGNIN',overridedProjectsName)
    // process.exit(0)
    const workspace = ProjectFrom(this.workspaceProjectLocation)
    workspace.children.forEach(childProject => {
      if (!overridedProjectsName.includes(childProject.name)) {
        childProject.setDefaultPortByType()
      }
    })

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
