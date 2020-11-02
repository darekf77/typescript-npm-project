//#region @backend
import { PackagesRecognitionExtended } from '../../features';
import { BuildOptions } from 'tnp-db';
import * as inquirer from 'inquirer';
import * as path from 'path';
import { TnpDB } from 'tnp-db';
import chalk from 'chalk';
//#endregion
import * as _ from 'lodash';
import { config } from 'tnp-config';
import type { Project } from './project';
import { Helpers, Project as $Project } from 'tnp-helpers';


export abstract class BuildableProject {


  //#region @backend
  public _buildOptions?: BuildOptions;

  get availableIsomorphicPackagesInNodeModules(this: Project): string[] {
    const jsonPath = path.join(this.location, PackagesRecognitionExtended.FILE_NAME_ISOMORPHIC_PACKAGES);
    try {
      const json = Helpers.readJson(jsonPath) as { isomorphicPackages: string[]; };
      return (json && _.isArray(json.isomorphicPackages)) ? json.isomorphicPackages : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * return copyto array with absulute pathes
   */
  public async selectProjectToCopyTO(this: Project, buildOptions?: BuildOptions): Promise<string[]> {
    let result = [] as Project[];
    const project = this;
    if (buildOptions && !_.isArray(buildOptions.copyto)) {
      buildOptions.copyto = [];
    }
    if (project.typeIs('unknow', 'docker') || (buildOptions && buildOptions.skipCopyToSelection)) {
      return;
    }
    // clearConsole()
    const db = await TnpDB.Instance();
    if (!global.tnpNonInteractive) {
      const existedProjects = (await db.getProjects())
        .map(p => p.project)
        .filter(p => p && !p.isWorkspaceChildProject && !p.isContainer)
        .filter(p => p.location !== project.location)

      _.sortBy(existedProjects, ['genericName']);
      // console.log('sorted', (existedProjects as Project[]).map(s => s.name))

      if (global.tnpNonInteractive) {
        // buildOptions.copyto = [];
        result = []
      } else {
        if (project.isTnp) {
          // buildOptions.copyto = [];
          result = []
        } else {
          const { projects = [] }: { projects: string[] } = await inquirer
            .prompt([
              {
                type: 'checkbox',
                name: 'projects',
                message: 'Select projects where to copy bundle after finish: ',
                choices: existedProjects
                  .map(c => {
                    return { value: c.location, name: `${chalk.bold(c.name)} (${c.genericName})` }
                  })
              }
            ]) as any;

          // buildOptions.copyto = projects.map(p => $Project.From<Project>(p)) as any;
          result = projects.map(p => $Project.From<Project>(p)) as any;
        }

      }

    }

    if (buildOptions) {
      buildOptions.copyto = result;
      await db.updateCommandBuildOptions(project.location, buildOptions);
      await db.updateBuildOptions(buildOptions, process.pid);
    }

    return (result as Project[]).map(p => (p as Project).location);
  }
  //#endregion



  //#region @backend

  get buildOptions() {
    if (!this._buildOptions) {
      return {};
    }
    return this._buildOptions;
  }
  set buildOptions(this: Project, v) {
    if (!v) {
      Helpers.log(`Trying to assign empty buildOption for ${chalk.bold(this.name)}`)
      return;
    }


    // Helpers.log(`
    // Assign build option for ${chalk.bold(this.name)}

    // ${_.isObject(v) ? JSON10.stringify(v) : ''};


    // `);

    this._buildOptions = v;
  }
  //#endregion

  //#region @backend
  protected async buildSteps(buildOptions?: BuildOptions) {
    // should be abstract
  }
  //#endregion


  get allowedEnvironments(this: Project) {
    if (Helpers.isBrowser) {
      return this.browser.allowedEnvironments;
    }
    //#region @backend
    if (this.typeIs('unknow')) {
      return [];
    }
    if (this.packageJson.data.tnp && _.isArray(this.packageJson.data.tnp.allowedEnv)) {
      return this.packageJson.data.tnp.allowedEnv.concat('local')
    }
    return config.allowedEnvironments.concat('local');
    //#endregion
  }


  //#region @backend
  private async selectAllProjectCopyto(this: Project) {
    const db = await TnpDB.Instance();
    const projects = (await db.getProjects())
      .map(p => p.project)
      .filter(p => p.location !== this.location)

    this.buildOptions.copyto = projects as any;
  }
  //#endregion

  //#region @backend
  isReadyForTarget(this: Project, target: Project) {
    const browserFor = path.join(this.location, `browser-for-${target.name}`);
    // console.log(`Not exists ${browserFor}`)
    return Helpers.exists(browserFor);
  }
  //#endregion

  //#region @backend
  async build(this: Project, buildOptions?: BuildOptions) {
    // Helpers.log(`BUILD OPTIONS: ${JSON10.stringify(buildOptions)}`)
    if (this.typeIs('unknow')) {
      return;
    }

    if (this.isCommandLineToolOnly) {
      buildOptions.onlyBackend = true;
    }


    this.buildOptions = buildOptions;

    let baseHref: string;
    // log('AM HERE')
    if (this.typeIs('workspace')) {
      baseHref = this.env.config.workspace.workspace.baseUrl;
    } else if (this.isWorkspaceChildProject) {
      if (buildOptions.appBuild) {
        const proj = this.env.config && this.env.config.workspace.projects.find(p => {
          return p.name === this.name
        });
        baseHref = proj ? proj.baseUrl : void 0
      }
    }

    // log(`basehref for current project `, baseHref)
    this.buildOptions.baseHref = baseHref;

    if (!buildOptions.appBuild) {
      if (this.buildOptions.copytoAll) {
        await this.selectAllProjectCopyto();
      } else {
        if (!Array.isArray(this.buildOptions.copyto) || this.buildOptions.copyto.length === 0) {
          if (this.isStandaloneProject && this.buildOptions.watch) {
            if (!this.isGenerated) {
              await this.selectProjectToCopyTO(this.buildOptions);
            }
          }
        }
      }
      if (_.isArray(this.buildOptions.copyto) && this.buildOptions.copyto.length > 0) {

        // const unique = {};
        // (this.buildOptions.copyto as any[]).forEach((p: Project) => unique[p.location] = p);
        // this.buildOptions.copyto = Object.keys(unique).map(location => unique[location]);
        if ((this.buildOptions.copyto as Project[]).includes(this)) {
          Helpers.info(`

          Please don't use ${chalk.bold('--copyto')} for project itself.
          node_modules/${this.name} will be reaplce with folder:
          - src (for isomorphic lib)
          or
          - componetnts (for angular-lib)

          `);
          (this.buildOptions.copyto as Project[]) = (this.buildOptions.copyto as Project[]).filter(p => p !== this);
        }
        this.buildOptions.copyto = Helpers.arrays.uniqArray<Project>(this.buildOptions.copyto, 'location');

        (this.buildOptions.copyto as any[]).forEach((proj: Project) => {
          const project = proj;
          const projectCurrent = this;
          const projectName = projectCurrent.name;
          const what = path.normalize(`${project.location}/${config.folder.node_modules}/${projectName}`)
          Helpers.info(`\n\n${chalk.bold('+ After each build finish')} ${Helpers.formatPath(what)} will be update.`)
        });
      }

      if (this.buildOptions.copytoAll || (_.isArray(this.buildOptions.copyto) && this.buildOptions.copyto.length > 0)) {
        this.packageJson.save('show before build')
      }
    }

    PackagesRecognitionExtended.fromProject(this as any).start();

    const { skipBuild = false } = require('minimist')(this.buildOptions.args.split(' '));
    if (skipBuild) {
      Helpers.log(`[buildable-project] Skip build for ${this.genericName}`);
    } else {
      // console.log('before build steps')
      await this.buildSteps(buildOptions);
    }
    Helpers.info(`Build steps ended... `);
    // console.log('after build steps')
    if (this.isStandaloneProject) {
      await this.copyManager.initCopyingOnBuildFinish(buildOptions);
    }

  }
  //#endregion
}
