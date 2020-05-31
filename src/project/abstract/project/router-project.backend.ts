import * as fse from 'fs-extra';
import * as path from 'path';
import * as _ from 'lodash';
import chalk from 'chalk';
export { ChildProcess } from 'child_process';
import { ChildProcess } from 'child_process';

import { Project } from './project';
import { Helpers } from 'tnp-helpers';
import { Morphi } from 'morphi';
import { Models } from 'tnp-models';
import { config } from '../../../config';
import { EnvironmentConfig } from '../../features';

export abstract class RouterProject {
  protected __defaultPort: number;
  get port(this: Project) {
    let env: Models.env.EnvConfigProject;
    if (this.isWorkspace) {
      env = this.env?.config?.workspace?.workspace;
    } else {
      env = this.env?.config?.workspace?.projects?.find(p => p.name === this.name);
    }
    const envPort = env?.port;
    return _.isNumber(envPort) ? envPort : this.__defaultPort;
  }

  //#region @backend
  protected startOnCommand(this: Project, args: string): string {
    // should be abstract
    return undefined;
  }
  //#endregion

  public routerTargetHttp(this: Project) {
    if (Helpers.isBrowser) {
      return this.browser._routerTargetHttp;
    }
    if (this.typeIs('unknow')) {
      return;
    }
    return `http://localhost:${this.getDefaultPort()}`;
  }

  public setDefaultPort(this: Project, port: number) {
    this.__defaultPort = port;
  }

  public getDefaultPort(this: Project) {
    if (Helpers.isBrowser) {
      return this.browser && this.browser.defaultPort;
    }

    return this.__defaultPort;

  }

  public setDefaultPortByType(this: Project) {
    this.setDefaultPort(Project.DefaultPortByType(this._type))
  }

  /**
   * Start server on top of static build
   * @param port
   */
  public async start(this: Project, args?: string) {
    if (this.typeIs('unknow')) {
      return;
    }
    if (this.isWorkspace && !this.isGenerated) {

      const genLocationWOrkspace = path.join(this.location, config.folder.bundle, this.name);
      const genWorkspace = Project.From<Project>(genLocationWOrkspace)
      if (!genWorkspace) {
        Helpers.error(`Workspace folder "${config.folder.bundle}" does not exists.`
          + ` Please run: ${chalk.bold('tnp static:build')} in this workspace.
Generated workspace should be here: ${genLocationWOrkspace}
        `)
      }
      await genWorkspace.start(args);
      return;
    }
    if (this.isStandaloneProject) {

    }
    if (this.isWorkspaceChildProject) {
      await (this.env as any as EnvironmentConfig).init(args, true)
      this.filesTemplatesBuilder.rebuild(true)
      Helpers.log(`Killing proces on port ${this.getDefaultPort()}`);
      await Helpers.killProcessByPort(this.getDefaultPort())
      Helpers.log(`Project: ${this.name} is running on port ${this.getDefaultPort()}`);
    }
    const command = this.startOnCommand(args);
    if (_.isString(command)) {
      const p = this.run(this.startOnCommand(args)).async()
      // p.on('exit', (ee) => {
      //   console.trace('exit !!!!', ee)
      // })
    }

  }
  //#endregion

}

// export interface RouterProject extends Partial<Project> { }
