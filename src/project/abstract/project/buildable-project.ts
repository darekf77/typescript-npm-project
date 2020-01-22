import * as _ from 'lodash';
import { JSON10 } from 'json10';
import { config } from '../../../config';
import { Project } from './project';
import { Helpers } from 'tnp-helpers';

//#region @backend
import { BuildOptions, PackagesRecognitionExtended } from '../../features';
import * as inquirer from 'inquirer';
import * as path from 'path';
import { TnpDB } from 'tnp-db';
import chalk from 'chalk';
//#endregion


export abstract class BuildableProject {


  //#region @backend
  public _buildOptions?: BuildOptions;

  private static async selectProjectToCopyTO(buildOptions: BuildOptions, project: Project) {
    if (project.type === 'unknow') {
      return;
    }
    // clearConsole()
    const db = await TnpDB.Instance(config.dbLocation);
    if (!global.tnpNonInteractive) {
      const existedProjects = db
        .getProjects()
        .map(p => p.project)
        .filter(p => p && !p.isWorkspaceChildProject && !p.isContainer)
        .filter(p => p.location !== project.location)

      _.sortBy(existedProjects, ['genericName']);
      // console.log('sorted', (existedProjects as Project[]).map(s => s.name))

      if (global.tnpNonInteractive) {
        buildOptions.copyto = [];
      } else {
        const { projects = [] }: { projects: string[] } = await inquirer
          .prompt([
            {
              type: 'checkbox',
              name: 'projects',
              message: 'Select projects where to copy bundle after finish: ',
              choices: existedProjects
                .map(c => {
                  return { value: c.location, name: c.genericName }
                })
            }
          ]) as any;

        buildOptions.copyto = projects.map(p => Project.From(p)) as any;
      }

    }

    if (!_.isArray(buildOptions.copyto)) {
      buildOptions.copyto = []
    }

    // log(this.buildOptions)
    // process.exit(0)

    await db.transaction.updateCommandBuildOptions(project.location, buildOptions);
    await db.transaction.updateBuildOptions(buildOptions, process.pid);
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
    if (this.type === 'unknow') {
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
    const db = await TnpDB.Instance(config.dbLocation);
    const projects = db
      .getProjects()
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
    if (this.type === 'unknow') {
      return;
    }

    if (this.isCommandLineToolOnly) {
      buildOptions.onlyBackend = true;
    }


    this.buildOptions = buildOptions;

    let baseHref: string;
    // log('AM HERE')
    if (this.type === 'workspace') {
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
          if (this.isStandaloneProject && this.buildOptions.watch && !this.isContainerChild) {
            if (!this.isGenerated) {
              await BuildableProject.selectProjectToCopyTO(this.buildOptions, this);
            }
          }
        }
      }
      if (_.isArray(this.buildOptions.copyto) && this.buildOptions.copyto.length > 0) {

        const unique = {};
        (this.buildOptions.copyto as any[]).forEach((p: Project) => unique[p.location] = p);
        this.buildOptions.copyto = Object.keys(unique).map(location => unique[location]);

        (this.buildOptions.copyto as any[]).forEach((proj: Project) => {
          const project = proj;
          const projectCurrent = this;
          const projectName = projectCurrent.isTnp ? config.file.tnpBundle : projectCurrent.name;
          const what = path.normalize(`${project.location}/node_module/${projectName}`)
          Helpers.info(`After each build finish ${what} will be update.`)
        });
      }

      if (this.buildOptions.copytoAll || (_.isArray(this.buildOptions.copyto) && this.buildOptions.copyto.length > 0)) {
        this.packageJson.save('show before build')
      }
    }

    PackagesRecognitionExtended.fromProject(this as any).start();
    // console.log('before build steps')
    await this.buildSteps(buildOptions);
    // console.log('after build steps')
    if (this.isStandaloneProject) {
      this.copyManager.initCopyingOnBuildFinish(buildOptions);
      // if (this.linkedProjects.length > 0) {
      //   const taskOutputModifer = `Output modifer for linkableProjects`
      //   if (buildOptions.outDir === 'bundle') {
      //     this.outputCodeModifier.copyBundleCompiledLinkedCodeToNodeModules();
      //   } else {
      //     if (buildOptions.watch) {
      //       await this.outputCodeModifier.startAndWatch(taskOutputModifer)
      //     } else {
      //       await this.outputCodeModifier.start(taskOutputModifer)
      //     }
      //   }
      // }

    }
  }
  //#endregion
}
