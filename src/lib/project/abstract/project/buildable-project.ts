//#region imports
//#region @backend
import { PackagesRecognition } from '../../features/package-recognition/packages-recognition';
import { BuildOptions } from 'tnp-db';
import * as inquirer from 'inquirer';
import { path } from 'tnp-core';
import chalk from 'chalk';
//#endregion
import { _ } from 'tnp-core';
import { config } from 'tnp-config';
import { Project } from './project';
import { Helpers, Project as $Project } from 'tnp-helpers';
import { CopyManager } from '../../features/copy-manager';
import { CopyManagerStandalone } from '../../features/copy-manager/copy-manager-standalone.backend';
import { CopyManagerOrganization } from '../../features/copy-manager/copy-manager-organization.backend';
//#endregion

export abstract class BuildableProject {

  //#region @backend
  public _buildOptions?: BuildOptions;

  //#region getters
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
  //#endregion

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
    if (this.parent?.isContainer) {

      const containerCoreProj = Project.by('container', this._frameworkVersion) as Project;

      // const projsChain = this.parent.projectsInOrderForChainBuild([]);
      const projsChain = this.parent.children;


      const independentProjects = projsChain
        .filter(parentChild => {
          return (parentChild.name !== this.parent.name)
            && (parentChild.typeIs('isomorphic-lib') && (parentChild.name === 'tnp'))
        });

      Helpers.log(`UPDATING ALSO container core ${this._frameworkVersion}...`)
      independentProjects.push(containerCoreProj);
      const tmpSmartNodeModulesProj = Project.From(path.dirname(containerCoreProj.smartNodeModules.path)) as Project;
      if (tmpSmartNodeModulesProj) {
        independentProjects.push(tmpSmartNodeModulesProj);
      }

      // @ts-ignore
      this.buildOptions.copyto = [
        ...independentProjects,
        ...this.buildOptions.copyto
      ]
    } else {

      // @ts-ignore
      this.buildOptions.copyto = [
        ...this.buildOptions.copyto
      ]
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
    const { obscure, uglify, nodts, websql, includeNodeModules }: {
      obscure: boolean,
      nodts: boolean,
      uglify: boolean,
      websql: boolean,
      includeNodeModules: boolean,
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
    if (_.isUndefined(buildOptions.includeNodeModules) && includeNodeModules) {
      buildOptions.includeNodeModules = true;
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
                // await this.selectProjectToCopyTO(this.buildOptions);
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

          Helpers.log(`${chalk.bold('+ After each build finish')} ${Helpers.formatPath(what)} will be update.`);
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
      if (f.isContainer) {
        return true;
      }
      return false;
    });

    let withoutNodeModules: Project[] = [];
    if (_.isArray(this.buildOptions.copyto) && !global.tnpNonInteractive) {
      // @ts-ignore
      (this.buildOptions.copyto as Project[]).forEach((c) => {
        Helpers.log(`Checking node_modules for ${c.genericName}`, 1);
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

    Helpers.info(`[buildable-project] Build steps ended... ${buildOptions.watch ? 'files watch started...' : ''}`);
    Helpers.log(`[buildable-project] Build steps ended (project type: ${this._type}) ... `);

    if (!buildOptions.appBuild) {
      if ((this.isStandaloneProject && this.typeIs('isomorphic-lib')) || this.isSmartContainer) {
        if (buildOptions.copyto.length > 0) {
          Helpers.info(`[buildable-project] copying compiled code/assets to ${buildOptions.copyto.length} other projects... `);
        }
        // console.log('after build steps')
        (() => {
          {
            return { CopyManagerOrganization, CopyManagerStandalone }
          }
        });
        this.copyManager = CopyManager.for(this);
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
  //#endregion
}
