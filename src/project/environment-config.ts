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


    const alreadyExistedWorksapceConfig = (project && project.parent && project.parent.type === 'workspace') ?
      EnvironmentConfig.woksapaceConfigs[project.parent.location] : null;

    // console.log('alreadyExistedWorksapceConfig', alreadyExistedWorksapceConfig)

    if (this.project.type === 'workspace') {
      this.kind = 'tnp-workspace';
    }

    if (this.project.parent && this.project.parent.type === 'workspace') {
      this.kind = 'tnp-workspace-child'
    }

    // console.log('this.project ', this.project.name)
    // console.log('this.project.parent ', this.project.parent ? this.project.parent.name : 'no parent')
    // console.log('this.project.location   ', this.project.location)
    // console.log('this.kind', this.kind)

    if (this.kind !== 'other') {
      // console.log('kind', this.kind)
      // console.log('kind', this.project.name)
      //#region resolve worksapce config
      if (_.isObject(alreadyExistedWorksapceConfig) && alreadyExistedWorksapceConfig !== null) {
        this.workspaceConfig = EnvironmentConfig.woksapaceConfigs[this.project.parent.location];
        // console.log('EnvironmentConfig.woksapaceConfigs', EnvironmentConfig.woksapaceConfigs)
      } else {

        if (this.kind === 'tnp-workspace-child') {
          let pathToWorkspaceProjectEnvironment = path.join(this.project.parent.location, 'environment');
          // console.log('pathToWorkspaceProjectEnvironment', pathToWorkspaceProjectEnvironment)
          if (fs.existsSync(`${pathToWorkspaceProjectEnvironment}.js`)) {
            this.workspaceConfig = require(pathToWorkspaceProjectEnvironment) as any;
          } else {
            this.kind = 'other';
          }
        } else if (this.kind === 'tnp-workspace') {
          let pathToProjectEnvironment = path.join(this.project.location, 'environment');
          // console.log('pathToProjectEnvironment', pathToProjectEnvironment)
          if (fs.existsSync(`${pathToProjectEnvironment}.js`)) {
            this.workspaceConfig = require(pathToProjectEnvironment) as any;
          } else {
            this.kind = 'other';
          }
        }
        if (this.kind !== 'other') {
          this.validateWorkspaceConfig();
          this.overrideDefaultPorts()
        }

      }

    }
    //#endregion

  }

  overrideDefaultPorts() {

    if (this.kind === 'tnp-workspace') {
      this.workspaceConfig.workspace.projects.forEach(d => {
        if (_.isNumber(d.port)) {
          const p = ProjectFrom(path.join(this.project.location, d.name))
          // console.log(`Overrided port from ${p.defaultPort} to ${d.port} in project: ${p.name}`)
          p.defaultPort = d.port;
        }
      })
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

  err() {
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
          minify: false
        },
        server: {
          minify: false
        }
      }
    }
    if (!_.isObject(_.get(this.workspaceConfig, 'workspace.build'))) {
      this.err()
    }

  }

  get options() {
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
        fse.writeJSONSync(pathTmpEnvPrepareOptions, options)
      }
    }
  }


  prepare(options?: BuildOptions) {
    if (this.project.type === 'workspace') {
      // console.log(`No need to prepare workspace config`)
      return
    }
    const startMode = !!options;
    // console.log('this.kind in prepare', this.kind)
    if (!this.config) {

      if (this.kind === 'other') {
        return
      }
      if (!startMode) {
        options = this.options.saved;
      }
      const { appBuild, prod, watch, environmentName } = options;

      this.options.save(options)

      // console.log('PREPARE options', options)
      this.config = _.cloneDeep(this.workspaceConfig);
      this.config.name = environmentName ? environmentName : 'local';
      this.config.isCoreProject = this.project.isCoreProject;


      if (this.kind === 'tnp-workspace') {
        if (!this.config.workspace || !this.config.workspace.workspace) {
          error(`You shoud define 'workspace' object inside config.workspace object`, true)
          this.err()
        }
        this.config.packageJSON = this.project.packageJson.data;
      }

      if (this.kind === 'tnp-workspace-child') {

        this.config.packageJSON = this.project.parent.packageJson.data;
      }

      this.config.workspace.projects.forEach(p => {
        p.host = (!this.config.domain) ? `http://localhost:${p.port}` : `${this.config.domain}${p.baseUrl}`;
      })

      if (this.kind === 'tnp-workspace-child') {
        this.config.currentProject = this.config.workspace.projects
          .find(p => p.name === this.project.name)
      } else if (this.kind === 'tnp-workspace') {
        this.config.currentProject = this.config.workspace.workspace
      }

      if (!this.config.currentProject) {
        error(`Cannot find current project (${this.project.name}) in config worksapce projects.`, true)
        this.err()
      }

      this.config.currentProject.isWatchBuild = watch;
      this.saveConfig()
      // console.log('config prepared!', this.config)
    }
  }


  saveConfig() {
    const tmpEnvironmentFileName = 'tmp-environment.json';
    const tmpEnvironmentPath = path.join(this.project.location, tmpEnvironmentFileName)
    if (this.project.type === 'angular-client') {
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

  get configFor() {
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



}
