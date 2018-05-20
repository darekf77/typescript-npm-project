import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as _ from 'lodash';

import { Project } from './base-project';
import { EnvConfig, BuildOptions, EnvironmentName } from '../models';
import { walkObject } from '../helpers';



export class EnvironmentConfig {

  static woksapaceConfigs = {} as { [workspacePath in string]: EnvConfig; }

  readonly workspaceConfig: EnvConfig;
  private config: EnvConfig;
  private kind: 'tnp-workspace' | 'tnp-workspace-child' | 'other' = 'other';


  constructor(private project: Project) {

    const alreadyExistedWorksapceConfig = EnvironmentConfig.woksapaceConfigs[this.project.parent.location]

    if (this.project.type === 'workspace') {
      this.kind = 'tnp-workspace';
    }

    if (this.project.parent && this.project.parent.type === 'workspace') {
      this.kind = 'tnp-workspace-child'
    }

    //#region resolve worksapce config
    if (_.isObject(alreadyExistedWorksapceConfig) && alreadyExistedWorksapceConfig !== null) {
      this.workspaceConfig = EnvironmentConfig.woksapaceConfigs[this.project.parent.location];
    } else {

      if (this.kind === 'tnp-workspace-child') {
        let pathToWorkspaceProjectEnvironment = path.join(this.project.parent.location, 'environment');
        if (fs.existsSync(`${pathToWorkspaceProjectEnvironment}.js`)) {
          this.workspaceConfig = require(pathToWorkspaceProjectEnvironment) as any;
        }
      } else if (this.kind === 'tnp-workspace') {
        let pathToProjectEnvironment = path.join(this.project.location, 'environment');
        if (fs.existsSync(`${pathToProjectEnvironment}.js`)) {
          this.workspaceConfig = require(pathToProjectEnvironment) as any;
        }
      }
    }
    //#endregion

  }



  prepare(options: BuildOptions) {
    if (this.kind === 'other') {
      return
    }
    const { appBuild, prod, watch, environmentName } = options;
    this.config = _.cloneDeep(this.workspaceConfig);
    this.config.name = environmentName ? environmentName : 'local';
    this.config.isCoreProject = this.project.isCoreProject;

    this.config.currentProject = this.config.workspace.projects
      .find(p => p.name === this.project.name)

    this.config.currentProject.isWatchBuild = watch;

    const tmpEnvironmentFileName = 'tmp-environment.json';
    const tmpEnvironmentPath = path.join(this.project.location, tmpEnvironmentFileName)
    if (this.project.type === 'angular-client') {
      fse.writeJSONSync(tmpEnvironmentPath, this.configFor.frontend, {
        encoding: 'utf8'
      })
    } else if (this.project.type === 'isomorphic-lib') {
      fse.writeJSONSync(tmpEnvironmentPath, this.configFor.backend, {
        encoding: 'utf8'
      })
    }

  }


  get configFor() {
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
