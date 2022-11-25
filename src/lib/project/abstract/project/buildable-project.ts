//#region imports
//#region @backend
import { PackagesRecognition } from '../../features/package-recognition/packages-recognition';
import { BuildOptions } from 'tnp-db';
import * as inquirer from 'inquirer';
import { path } from 'tnp-core';
import { TnpDB } from 'tnp-db';
import chalk from 'chalk';
//#endregion
import { _ } from 'tnp-core';
import { config } from 'tnp-config';
import { Project } from './project';
import { Helpers, Project as $Project } from 'tnp-helpers';
import { CopyManager } from '../../features/copy-manager';
//#endregion

export abstract class BuildableProject {


  //#region @backend
  public _buildOptions?: BuildOptions;

  // @ts-ignore
  get availableIsomorphicPackagesInNodeModules(this: Project): string[] {
    const jsonPath = path.join(this.location, PackagesRecognition.FILE_NAME_ISOMORPHIC_PACKAGES);
    try {
      const json = Helpers.readJson(jsonPath) as { isomorphicPackages: string[]; };
      return (json && _.isArray(json.isomorphicPackages)) ? json.isomorphicPackages : [];
    } catch (error) {
      return [];
    }
  }

  get trustedAllPossible() {
    const projTnp = Project.Tnp as Project;
    PackagesRecognition.fromProject(projTnp, true).start();
    return projTnp.availableIsomorphicPackagesInNodeModules;
  }

  // @ts-ignore
  get trusted(this: Project) {
    const projTnp = Project.Tnp as Project;
    PackagesRecognition.fromProject(projTnp, true).start();
    projTnp.availableIsomorphicPackagesInNodeModules;
    const currentProjVersion = this._frameworkVersion;
    const value = projTnp.packageJson.trusted[currentProjVersion];
    if (value === '*') {
      return projTnp.availableIsomorphicPackagesInNodeModules;
    }
    if (Array.isArray(value)) {
      return value;
    }
    return [];
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
        .filter(p => p.location !== project.location);

      _.sortBy(existedProjects, ['genericName']);
      // console.log('sorted', (existedProjects as Project[]).map(s => s.name))

      if (global.tnpNonInteractive) {
        // buildOptions.copyto = [];
        result = [];
      } else {
        if (project.isTnp || project.isNaviCli) {
          // buildOptions.copyto = [];
          result = [];
        } else {
          // global.spinner?.stop();
          const { projects = [] }: { projects: string[] } = await inquirer
            .prompt([
              {
                type: 'checkbox',
                name: 'projects',
                message: `Select projects where to copy bundle after ${buildOptions?.watch ? 'each compilation finish' : 'finish'} :`,
                choices: existedProjects
                  .map(c => {
                    return { value: c.location, name: `${chalk.bold(c.name)} (${c.genericName})` };
                  })
              }
            ]) as any;
          // global.spinner?.start();
          // buildOptions.copyto = projects.map(p => $Project.From<Project>(p)) as any;
          result = projects.map(p => $Project.From<Project>(p)) as any;
        }

      }

    }

    if (buildOptions) {
      // @ts-ignore
      buildOptions.copyto = result;
      await db.updateCommandBuildOptions(project.location, buildOptions);
      await db.updateBuildOptions(buildOptions, process.pid);
    }

    return (result as Project[]).map(p => (p as Project).location);
  }
  //#endregion

  //#region @backend

  get buildOptions(): BuildOptions {
    if (!this._buildOptions) {
      return {} as any;
    }
    return this._buildOptions;
  }

  // @ts-ignore
  set buildOptions(this: Project, v) {
    if (!v) {
      Helpers.log(`Trying to assign empty buildOption for ${chalk.bold(this.name)}`);
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

  // @ts-ignore
  get allowedEnvironments(this: Project) {
    if (Helpers.isBrowser) {
      return this.browser.allowedEnvironments;
    }
    //#region @backend
    if (this.typeIs('unknow')) {
      return [];
    }
    if (this.packageJson.data.tnp && _.isArray(this.packageJson.data.tnp.allowedEnv)) {
      return this.packageJson.data.tnp.allowedEnv.concat('local');
    }
    return config.allowedEnvironments.concat('local');
    //#endregion
  }


  //#region @backend
  private async selectAllProjectCopyto(this: Project) {
    if (this.parent?.isContainer && this.parent.frameworkVersionAtLeast('v2')) {

      const containerProj = Project.by('container', this._frameworkVersion) as Project;

      // const projsChain = this.parent.projectsInOrderForChainBuild([]);
      const projsChain = this.parent.children;


      const projects = projsChain.filter(d => d.name !== this.parent.name
        && d.frameworkVersionAtLeast(this._frameworkVersion)
        && d.typeIs(
          'isomorphic-lib',
          'angular-lib',
          'vscode-ext',
          'workspace',
          'scenario',
          'electron-client',
          'ionic-client',
          'container'
        ) || d.isSmartContainer);

      if (containerProj.packageJson.data.dependencies[this.name]
        || Object.keys(config.frameworkNames).includes(this.name) // TODO QUICK_FIX
      ) {
        Helpers.info(`UPDATING ALSO container core ${this._frameworkVersion}...`)
        projects.push(containerProj);
        const tmpSmartNodeModulesProj = Project.From(path.dirname(containerProj.smartNodeModules.path)) as Project;
        if (tmpSmartNodeModulesProj) {
          projects.push(tmpSmartNodeModulesProj);
        }
      }

      // @ts-ignore
      this.buildOptions.copyto = projects as any;
    } else {
      const db = await TnpDB.Instance();
      const projects = (await db.getProjects())
        .map(p => p.project)
        .filter(p => p.location !== this.location);

      // @ts-ignore
      this.buildOptions.copyto = projects as any;
    }
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

    //#region TODO refactor this part
    const options = require('minimist')(buildOptions.args.split(' '));
    // console.log({ options })
    const { obscure, uglify, nodts, websql }: {
      obscure: boolean,
      nodts: boolean,
      uglify: boolean,
      websql: boolean,
    } = options

    if (_.isUndefined(buildOptions.obscure) && obscure) {
      buildOptions.obscure = true;
    }
    if (_.isUndefined(buildOptions.nodts) && nodts) {
      buildOptions.nodts = true;
    }
    if (_.isUndefined(buildOptions.uglify) && uglify) {
      buildOptions.uglify = true;
    }
    if (_.isUndefined(buildOptions.websql) && websql) {
      buildOptions.websql = true;
    }
    //#endregion


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
          return p.name === this.name;
        });
        baseHref = proj ? proj.baseUrl : void 0;
      }
    }

    // log(`basehref for current project `, baseHref)
    this.buildOptions.baseHref = baseHref;

    if (!buildOptions.appBuild) {
      if (this.buildOptions.copytoAll) {
        await this.selectAllProjectCopyto();
      } else {
        if (!this.isVscodeExtension) {
          if (!Array.isArray(this.buildOptions.copyto) || this.buildOptions.copyto.length === 0) {
            if (this.isStandaloneProject && this.buildOptions.watch) {
              if (!this.isGenerated) {
                await this.selectProjectToCopyTO(this.buildOptions);
              }
            }
          }
        }
      }

      // // TODO  -> FOR BUNDLE copyt node_modules not link
      if (!_.isArray(this.buildOptions.copyto)) {
        this.buildOptions.copyto = [];
      }

      // @ts-ignore
      const additionalSmartContainerChildren = (this.buildOptions.copyto as Project[])
        .filter(c => c.isSmartContainer)
        .reduce((a, b) => {
          return a.concat(b.children)
        }, []);

      // @ts-ignore
      this.buildOptions.copyto = [
        ...additionalSmartContainerChildren,
        // @ts-ignore
        ...this.buildOptions.copyto,
      ];


      if (_.isArray(this.buildOptions.copyto) && this.buildOptions.copyto.length > 0) {

        // @ts-ignore
        this.buildOptions.copyto = Helpers.arrays.uniqArray<Project>(this.buildOptions.copyto, 'location');

        // @ts-ignore
        (this.buildOptions.copyto as any[]).forEach((proj: Project) => {
          const project = proj;
          const projectCurrent = this;
          const projectName = projectCurrent.name;
          const what = path.normalize(`${project.location}/${config.folder.node_modules}/${projectName}`);
          Helpers.info(`\n\n${chalk.bold('+ After each build finish')} ${Helpers.formatPath(what)} will be update.`);
        });
      }

      // @ts-ignore
      if (this.buildOptions.copytoAll || (_.isArray(this.buildOptions.copyto) && this.buildOptions.copyto.length > 0)) {
        this.packageJson.save('show before build');
      }
    }

    // TODO QUICK FIX
    // @ts-ignore
    this.buildOptions.copyto = (this.buildOptions.copyto ? this.buildOptions.copyto : []);

    // @ts-ignore
    this.buildOptions.copyto = (this.buildOptions.copyto as Project[]).filter(f => {
      if (f.typeIs('angular-lib', 'isomorphic-lib')) {
        return true;
      }
      if (f.isContainerCoreProject || f.isSmartContainer) {
        return true;
      }
      return false;
    });

    let withoutNodeModules: Project[] = [];
    if (_.isArray(this.buildOptions.copyto) && !global.tnpNonInteractive) {
      // @ts-ignore
      (this.buildOptions.copyto as Project[]).forEach((c) => {
        Helpers.info(`Checking node_modules for ${c.genericName}`);
        if (!c.node_modules.exist) {
          withoutNodeModules.push(c);
        }
      });
    }

    const smartInstall = withoutNodeModules.filter(p => p.npmPackages.useSmartInstall);

    withoutNodeModules = withoutNodeModules.filter(p => !smartInstall.includes(p));

    if (withoutNodeModules.length > 0 && !this.isVscodeExtension) {

      Helpers.error(`[--copyto] Please install node_modules for projects:

${withoutNodeModules.map(c => `\t- ${c.name} in ${c.location}`).join('\n ')}

      `, false, true);
    }

    for (let index = 0; index < smartInstall.length; index++) {
      const p = smartInstall[index];
      Helpers.warn(`

      [copyto] Smart npm instalation for ${p.name}

      `);
      p.npmPackages.installFromArgs('');
    }

    if (!this.isVscodeExtension) {
      PackagesRecognition.fromProject(this as any).start(void 0, '[buildable-project]');
    }

    // if (this.isSmartContainerChild) {
    //   this.buildOptions.copyto = []
    // }

    if (!buildOptions.appBuild) {
      Helpers.info(`[info] Copy compiled project to ${buildOptions.copyto.length} projects... `);
    }

    const { skipBuild = false } = require('minimist')(this.buildOptions.args.split(' '));
    if (skipBuild) {
      Helpers.log(`[buildable-project] Skip build for ${this.genericName}`);
    } else {
      // console.log('before build steps')
      await this.buildSteps(buildOptions);
    }

    Helpers.info(`[buildable-project] Build steps ended (project type: ${this._type}) ... `);

    if (!buildOptions.appBuild) {
      if (
        (this.isStandaloneProject && this.typeIs('isomorphic-lib'))
        // && !this.isSmartContainerTarget // TODO @LAST @UNCOMMENT
        || this.isSmartContainerTarget // @LAST fixing tmp local project for containeri target
      ) {
        if (buildOptions.copyto.length > 0) {
          Helpers.info(`[buildable-project] copying build data to ${buildOptions.copyto.length} projects... `);
        }
        // console.log('after build steps')
        this.copyManager = new CopyManager(this);
        if (this.isStandaloneProject || this.isSmartContainer) {
          this.copyManager.init(buildOptions);
          const taskName = 'copyto manger';
          if (buildOptions.watch) {
            await this.copyManager.startAndWatch(taskName)
          } else {
            await this.copyManager.start(taskName)
          }
        }
      }
    }


  }
  //#endregion
}
