//#region @backend
import * as fse from 'fs-extra';
import * as path from 'path';
import * as _ from 'lodash';
import * as glob from 'glob';

import { error, warn, isValidIp, log } from '../../../helpers';
import {
  err, overrideDefaultPortsAndWorkspaceConfig,
  saveConfigWorkspca, tmpEnvironmentFileName, workspaceConfigBy,
  overrideWorksapceRouterPort
} from './environment-config-helpers';
import { FeatureForProject } from '../../abstract';
//#endregion

import { Morphi } from 'morphi';
import config from '../../../config';
import { EnvConfig, EnvironmentName } from '../../../models';
import chalk from 'chalk';


//#region @backend
const environmentWithGeneratedIps: EnvironmentName[] = ['prod', 'stage'];
//#endregion

export interface IEnvironmentConfig {
  readonly config: EnvConfig
}

export class EnvironmentConfig
  //#region @backend
  extends FeatureForProject
//#endregion
{

  browser: IEnvironmentConfig;
  //#region @backend

  /**
     * Avaliable for worksapce and children
     * Use only for workspace things
     */


  /// TODO remove children config links

  get isChildProjectWithoutConfig() {
    const f = path.join(this.project.location, tmpEnvironmentFileName);
    return !fse.existsSync(f);
  }

  public async init(args?: string, overridePortsOnly: boolean = void 0) {


    const initFromScratch = (!this.project.env.config ||
      (this.project.isWorkspaceChildProject && !this.project.parent.env.config));

    overridePortsOnly = !_.isUndefined(overridePortsOnly) ? overridePortsOnly : !initFromScratch;
    if (!initFromScratch) {
      log(`Config alredy ${chalk.bold('init')}ed tnp. ${chalk.green('Environment for')} `
        + `${this.project.isGenerated ? chalk.bold('(generated)') : ''} `
        + `${chalk.green(chalk.bold(this.project.genericName))}: ${chalk.bold(this.project.env.config.name)}`)
    }


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
      // error(`[${path.basename(__filename)}] Please override parent config first`);
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

    const config = await workspaceConfigBy(this.project, environmentName);
    config.name = environmentName;

    config.dynamicGenIps = (environmentWithGeneratedIps.includes(config.name)) || generateIps;

    await overrideWorksapceRouterPort({ workspaceProjectLocation, workspaceConfig: config })
    await overrideDefaultPortsAndWorkspaceConfig({ workspaceProjectLocation, workspaceConfig: config });

    if (overridePortsOnly) {
      log('Only ports overriding.. ')
      return;
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

      if (config.name === 'local') {
        p.host = `http://${config.ip}:${p.port}`;
      } else {
        p.host = `${config.workspace.workspace.host}${p.baseUrl}`;
      }

    })


    if (this.project.git.isGitRepo) {
      config.build = {
        number: this.project.git.countComits(),
        date: this.project.git.lastCommitDate(),
        hash: this.project.git.lastCommitHash()
      }
    }

    saveConfigWorkspca(this.project, config)
  }
  //#endregion

  private static configs: { [location: string]: EnvConfig } = {};

  public get configsFromJs(): EnvConfig[] { // TODO something if weird here
    //#region @backendFunc
    const p = this.project.isWorkspaceChildProject ? this.project.parent : this.project;
    const locations = glob.sync(`${p.location}/*${config.file.environment}.*js`);
    const configs = locations.map(l => {
      let c: EnvConfig;
      try {
        const jsFileName = l.replace(/\.js$/, '');
        // console.log('jsFileName', jsFileName)
        c = require(jsFileName).config
        if (path.basename(jsFileName).split('.').length === 2) {
          c.name = path.basename(jsFileName).split('.')[1] as any;
        } else {
          c.name = 'local';
        }

        // console.log('cdddd', c.domain)
      } catch (error) {

      }
      return _.cloneDeep(c);
    }).filter(c => !!c);
    return configs;
    //#endregion
  }

  /**
   * Can be accesed only after env.prepare()
   */
  public get config(): EnvConfig {
    if (Morphi.IsBrowser) {
      return this.browser.config;
    }
    //#region @backend
    const configPath = path.resolve(path.join(this.project.location, tmpEnvironmentFileName));
    if (fse.existsSync(configPath)) {
      const res = fse.readJsonSync(configPath) as EnvConfig;
      EnvironmentConfig.configs[configPath] = res;
      return res;
    } else {
      warn(`confg doesnt exist: ${configPath}`)
      return EnvironmentConfig.configs[configPath]
    }
    //#endregion

  }






}

