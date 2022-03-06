//#region @backend
import { fse } from 'tnp-core'
import { path } from 'tnp-core'
import { _ } from 'tnp-core';
import { glob } from 'tnp-core';
import chalk from 'chalk';
import {
  err, overrideDefaultPortsAndWorkspaceConfig,
  saveConfigWorkspca as saveEnvironmentConfig, tmpEnvironmentFileName, workspaceConfigBy,
  overrideWorksapceRouterPort,
  standaloneConfigBy
} from './environment-config-helpers';
import { FeatureForProject } from '../../abstract';
//#endregion

import { Helpers } from 'tnp-helpers';
import { config, ConfigModels } from 'tnp-config';
import { Models } from 'tnp-models';


//#region @backend
const environmentWithGeneratedIps: ConfigModels.EnvironmentName[] = ['prod', 'stage'];
//#endregion

export interface IEnvironmentConfig {
  readonly config: Models.env.EnvConfig
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
   * QUICK_FIX? remove children config links
   */
  get isChildProjectWithoutConfig() {
    const f = path.join(this.project.location, tmpEnvironmentFileName);
    return !fse.existsSync(f);
  }

  public async updateData(configEn?: Models.env.EnvConfig) {
    if (this.project.isStandaloneProject && this.project.isGenerated) {
      return;
    }
    configEn = !!configEn ? configEn : this.project.env.config;
    if (this.project.git.isGitRepo) {
      if (!configEn && this.project.frameworkVersionAtLeast('v3') && this.project.typeIs('isomorphic-lib')) {
        Helpers.error(`Please build library first: ${config.frameworkName} build:dist`,)
      }
      configEn.build = {
        number: this.project.git.countComits(),
        date: this.project.git.lastCommitDate(),
        hash: this.project.git.lastCommitHash(),
        options: {
          isWatchBuild: this.project.buildOptions.watch,
          outDir: this.project.buildOptions.outDir,
        }
      }
    }
    saveEnvironmentConfig(this.project, configEn);
  }


  public async init(args?: string, overridePortsOnly: boolean = void 0) {
    if (this.project.isStandaloneProject && this.project.isGenerated) {
      return;
    }
    // console.log('INITIN ENV!')

    let workspaceProjectLocation: string;

    if (this.project.isStandaloneProject) {

    } else {
      const initFromScratch = (!this.project.env.config ||
        (this.project.isWorkspaceChildProject && !this.project.parent.env.config));

      overridePortsOnly = !_.isUndefined(overridePortsOnly) ? overridePortsOnly : !initFromScratch;
      if (!initFromScratch) {
        Helpers.log(`Config alredy ${chalk.bold('init')}ed tnp. ${'Environment for'} `
          + `${this.project.isGenerated ? chalk.bold('(generated)') : ''} `
          + `${chalk.green(chalk.bold(this.project.genericName))}: ${chalk.bold(this.project.env.config.name)}`)
      }
      if (this.project.isWorkspace) {
        workspaceProjectLocation = path.join(this.project.location);
      } else if (this.project.isWorkspaceChildProject) {
        workspaceProjectLocation = path.join(this.project.parent.location);
      }

      if (this.project.isWorkspaceChildProject && this.isChildProjectWithoutConfig) {
        await (this.project.parent.env as any as EnvironmentConfig).init(args, overridePortsOnly);
        this.project.parent.filesTemplatesBuilder.rebuild();
        // error(`[${path.basename(crossPlartformPath(__filename))}] Please override parent config first`);
      }

      if (this.project.isWorkspaceChildProject) {
        await overrideWorksapceRouterPort({ workspaceProjectLocation, workspaceConfig: this.config }, false)
        await overrideDefaultPortsAndWorkspaceConfig({ workspaceProjectLocation, workspaceConfig: this.config }, false);
      }

      if (!this.project.isWorkspace) {
        return
      }

    }


    const { generateIps, env }: { generateIps: boolean, env: ConfigModels.EnvironmentName } =
      _.isString(args) ? require('minimist')(args.split(' ')) : { generateIps: false };

    const environmentName = (_.isString(env) && env.trim() !== '') ? env : 'local'

    if (this.project.isStandaloneProject) {
      var configResult = await standaloneConfigBy(this.project, environmentName);
    } else {
      var configResult = await workspaceConfigBy(this.project, environmentName);
    }

    configResult.name = environmentName;

    configResult.dynamicGenIps = (environmentWithGeneratedIps.includes(configResult.name)) || generateIps;

    if (this.project.isStandaloneProject) {

    } else {
      await overrideWorksapceRouterPort({ workspaceProjectLocation, workspaceConfig: configResult })
      await overrideDefaultPortsAndWorkspaceConfig({ workspaceProjectLocation, workspaceConfig: configResult });
      const envTempFileExists = fse.existsSync(path.join(this.project.location, config.file.tnpEnvironment_json));
      if (overridePortsOnly && envTempFileExists) {
        Helpers.log('Only ports overriding.. ')
        return;
      }
    }

    configResult.isCoreProject = this.project.isCoreProject;

    if (!configResult.ip) {
      configResult.ip = 'localhost'
    } else {
      if (_.isString(configResult.ip)) {
        configResult.ip = configResult.ip.replace(/^https?:\/\//, '');
      }
      if (!Helpers.isValidIp(configResult.ip)) {
        Helpers.error(`Bad ip address in your environment .json config`, true)
        err(configResult, void 0, this.project.location);
      }
    }

    if (_.isString(configResult.domain)) {
      configResult.domain = configResult.domain.replace(/\/$/, '');
      configResult.domain = configResult.domain.replace(/^https?:\/\//, '');
    }

    configResult.packageJSON = this.project.packageJson.data;
    // config.frameworks = this.project.frameworks;
    // console.log(`this.project.frameworks for ${this.project.genericName}`, this.project.frameworks)
    // process.exit(0)

    if (this.project.isStandaloneProject) {


    } else {

      if (!configResult.workspace || !configResult.workspace.workspace) {
        Helpers.error(`You shoud define 'workspace' object inside config.workspace object`, true)
        err(configResult, void 0, this.project.location)
      }

      if (configResult.name === 'local' || !configResult.domain) {
        configResult.workspace.workspace.host =
          `http://${configResult.ip}:${configResult.workspace.workspace.port}`;
      } else {
        const workspaceBaseUrl = _.isString(configResult.workspace.workspace.baseUrl) ? configResult.workspace.workspace.baseUrl : ''
        configResult.workspace.workspace.host =
          `https://${configResult.domain}${workspaceBaseUrl}`;
      }

      configResult.workspace.workspace.host = configResult.workspace.workspace.host.replace(/\/$/, '');

      configResult.workspace.projects.forEach(p => {

        if (configResult.name === 'local') {
          p.host = `http://${configResult.ip}:${p.port}`;
        } else {
          p.host = `${configResult.workspace.workspace.host}${p.baseUrl}`;
        }

      });
    }



    await this.updateData(configResult);
  }
  //#endregion

  public static configs: { [location: string]: Models.env.EnvConfig } = {};

  public get configsFromJs(): Models.env.EnvConfig[] { // QUICK_FIX something if weird here
    //#region @backendFunc
    const p = this.project.isWorkspaceChildProject ? this.project.parent : this.project;
    const locations = glob.sync(`${p.location}/*${config.file.environment}.*js`);
    const configs = locations.map(l => {
      let c: Models.env.EnvConfig;
      try {
        const jsFileName = l.replace(/\.js$/, '');
        c = Helpers.require(jsFileName).config;
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
  public get config(): Models.env.EnvConfig {
    if (Helpers.isBrowser) {
      return this.browser.config;
    }
    //#region @backend
    const configPath = path.resolve(path.join(this.project.location, tmpEnvironmentFileName));
    if (fse.existsSync(configPath)) {
      const res = fse.readJsonSync(configPath) as Models.env.EnvConfig;
      EnvironmentConfig.configs[configPath] = res;
      return res;
    } else {
      global.globalSystemToolMode && Helpers.warn(`confg doesnt exist: ${configPath}`)
      return EnvironmentConfig.configs[configPath]
    }
    //#endregion

  }






}
