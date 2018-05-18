import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';

import { Project } from './base-project';
import { EnvConfig, BuildOptions } from '../models';
import { walkObject } from '../helpers';



export class EnvironmentConfig {

  static woksapaceConfigs = {} as { [workspacePath in string]: EnvConfig; }

  readonly configInWorkspace: EnvConfig;
  private config: EnvConfig;
  private isChildProject = false;


  constructor(private project: Project) {


    if (this.project.parent && this.project.parent.type === 'workspace') {
      this.isChildProject = true;

      const alreadyExistedWorksapceConfig = EnvironmentConfig.woksapaceConfigs[this.project.parent.location]

      if (_.isObject(alreadyExistedWorksapceConfig) && alreadyExistedWorksapceConfig !== null) {
        this.configInWorkspace = EnvironmentConfig.woksapaceConfigs[this.project.parent.location];
      } else {
        let pathToWorkspaceProjectEnvironment = path.join(this.project.parent.location, 'environment');
        if (fs.existsSync(`${pathToWorkspaceProjectEnvironment}.js`)) {
          this.configInWorkspace = require(pathToWorkspaceProjectEnvironment) as any;
        }
      }

    }

  }

  prepare(options: BuildOptions) {
    if (!this.isChildProject) {
      return
    }
    const { appBuild, prod, watch, environmentName } = options;
    this.config = _.cloneDeep(this.configInWorkspace);
    this.config.name = environmentName ? environmentName : 'local';
    this.config.isCoreProject = this.project.isCoreProject;


  private example: EnvConfig = {
    workspace: {
      projects: [
      ]
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

  build(environmentName: string) {

  }





  aa() {
    // if (this.parent && this.parent.type === 'workspace') {
    //     let pathToWorkspaceProjectEnvironment = path.join(this.parent.location, 'environment');
    //     if (fs.existsSync(`${pathToWorkspaceProjectEnvironment}.js`)) {
    //         // console.log('path to search for envrionment', path.join(this.parent.location, 'environment'))
    //         const env: EnvConfig = require(pathToWorkspaceProjectEnvironment) as any;

    //         if (Array.isArray(env.routes)) {
    //             this.routes = env.routes;
    //         }

    //         const route = env.routes.find(r => r.project === this.name);
    //         if (route) {
    //             // console.log('route', route)
    //             this.defaultPort = route.localEnvPort;
    //             // console.log('new default port', this.defaultPort)
    //         } else {
    //             // console.log(`No route default port for ${this.name} in ${this.location}`)
    //         }
    //     }
    // }
  }


}
