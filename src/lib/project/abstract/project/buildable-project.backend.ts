//#region imports
import { PackagesRecognition } from '../../features/package-recognition/packages-recognition';
import { BuildOptions } from '../../../build-options';
import * as inquirer from 'inquirer';
import { crossPlatformPath, path } from 'tnp-core/src';
import chalk from 'chalk';


import { _ } from 'tnp-core/src';
import { config } from 'tnp-config/src';
import { Project } from './project';
import { Helpers } from 'tnp-helpers/src';
import { CopyManager } from '../../features/copy-manager';

import { CopyManagerStandalone } from '../../features/copy-manager/copy-manager-standalone.backend';
import { CopyManagerOrganization } from '../../features/copy-manager/copy-manager-organization.backend';
import { argsToClear } from '../../../constants';
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

  // @ts-ignore
  get trusted(this: Project): string[] {
    const projTnp = Project.Tnp;

    let trusted = [];
    if (config.frameworkName === 'tnp') {
      const value = Helpers.readValueFromJson(crossPlatformPath([
        projTnp.location,
        config.file.package_json__tnp_json5, // TODO replace with firedev.json5 in future
      ]), `core.dependencies.trusted.${this._frameworkVersion}`);
      if (value === '*') {
        return [];
      }
      trusted = value;
    }

    if (config.frameworkName === 'firedev') {
      const value = Helpers.readValueFromJson(crossPlatformPath([
        projTnp.location,
        config.file.tnpEnvironment_json,
      ]), `packageJSON.tnp.core.dependencies.trusted.${this._frameworkVersion}`);
      if (value === '*') {
        return [];
      }
      trusted = value;
    }

    if (!Array.isArray(trusted)) {
      return [];
    }
    return Helpers.arrays.uniqArray([
      ...trusted,
      ...this.additionalTrustedPackages,
    ]);
  }

  // @ts-ignore
  get trustedMaxMajorVersion(this: Project): number | undefined {
    const projTnp = Project.Tnp;

    let trustedValue: number;
    if (config.frameworkName === 'tnp') {
      const value = Helpers.readValueFromJson(crossPlatformPath([
        projTnp.location,
        config.file.package_json__tnp_json5, // TODO replace with firedev.json5 in future
      ]), `core.dependencies.trustedMaxMajor.${this._frameworkVersion}`);
      trustedValue = value;
    }

    if (config.frameworkName === 'firedev') {
      const file = crossPlatformPath([
        projTnp.location,
        config.file.tnpEnvironment_json,
      ]);
      const value = Helpers.readValueFromJson(file, `packageJSON.tnp.core.dependencies.trustedMaxMajor.${this._frameworkVersion}`);
      trustedValue = value;
    }
    trustedValue = Number(trustedValue);
    return (_.isNumber(trustedValue) && !isNaN(trustedValue)) ? trustedValue : Number.POSITIVE_INFINITY;
  }
  //#endregion

  /**
   * for navi-cli etc.
   */
  // @ts-ignore
  get additionalTrustedPackages(this: Project): string[] {
    const projTnp = Project.Tnp;

    let trustedValue = [];
    if (config.frameworkName === 'tnp') {
      const value = Helpers.readValueFromJson(crossPlatformPath([
        projTnp.location,
        config.file.package_json__tnp_json5, // TODO replace with firedev.json5 in future
      ]), `core.dependencies.additionalTrusted`);
      trustedValue = value;
    }

    if (config.frameworkName === 'firedev') {
      const file = crossPlatformPath([
        projTnp.location,
        config.file.tnpEnvironment_json,
      ]);
      const value = Helpers.readValueFromJson(file, `packageJSON.tnp.core.dependencies.additionalTrusted`);
      trustedValue = value;
    }

    const additionalTrusted = Array.isArray(trustedValue) ? trustedValue : [];
    // console.log({
    //   additionalTrusted
    // })
    return additionalTrusted;
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
  protected async buildSteps(buildOptions?: BuildOptions, libBuildDone?: () => void) {
    // should be abstract
  }
  //#endregion

  //#region methods allowed environments
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
  //#endregion

  //#region @backend
  private async selectAllProjectCopyto(this: Project) {
    const containerCoreProj = Project.by('container', this._frameworkVersion) as Project;
    const tempCoreContainerPathForSmartNodeModules = crossPlatformPath(path.dirname(containerCoreProj.smartNodeModules.path));

    const independentProjects = [];

    Helpers.log(`[${config.frameworkName}][copytoall] UPDATING ALSO container core ${this._frameworkVersion}...`)

    const tmpSmartNodeModulesProj = Project.From(tempCoreContainerPathForSmartNodeModules) as Project;
    if (tmpSmartNodeModulesProj) {
      Helpers.log(`${config.frameworkName}][copytoall] UPDATING smart node_modules for container core ${this._frameworkVersion}...`)
      independentProjects.push(tmpSmartNodeModulesProj);
    } else {
      Helpers.logWarn(`${config.frameworkName}][copytoall] Not able to find smart node_modules`
        + ` by path:\n${tempCoreContainerPathForSmartNodeModules}`)
    }

    const packageName = this.isSmartContainer ? ('@' + this.name) : this.name;
    Helpers.createSymLink(
      crossPlatformPath([containerCoreProj.smartNodeModules.path, packageName]),
      crossPlatformPath([containerCoreProj.node_modules.path, packageName]),
      { continueWhenExistedFolderDoesntExists: true }
    );

    if (config.frameworkName === 'tnp' && this.name !== 'tnp') {
      // tnp in tnp is not being used at all
      independentProjects.push(Project.Tnp)
    }

    // @ts-ignore
    this.buildOptions.copyto = [
      ...independentProjects,
      ...this.buildOptions.copyto
    ]

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

    // log(`basehref for current project `, baseHref)
    this.buildOptions.baseHref = baseHref;

    if (!buildOptions.appBuild) {
      if (this.buildOptions.copytoAll) {
        await this.selectAllProjectCopyto();
      }

      // // TODO  -> FOR RELASE copyt node_modules not link
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
      if (f.typeIs('isomorphic-lib')) {
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

    // if (!buildOptions.appBuild) {
    //   Helpers.info(`[info] Copy compiled project to ${buildOptions.copyto.length} projects... `);
    //   Helpers.logInfo((buildOptions.copyto as Project[]).map(p => p.genericName).join(';'));
    // }

    const { skipBuild = false } = require('minimist')(this.buildOptions.args.split(' '));
    // console.log({
    //   skipBuild
    // })

    //#region build assets file
    /**
     * Build assets file for app in app build mode
     */
    const buildAssetsFile = async () => {
      // console.log('after build steps');
      let client: string;
      if (this.isSmartContainer) {
        let args = buildOptions.args;
        args = Helpers.cliTool.removeArgFromString(args, argsToClear);
        client = Helpers.removeSlashAtEnd(_.first((args || '').split(' '))) as any;
        const smartContainerBuildTarget = (
          this.isSmartContainerChild
            ? this.parent.smartContainerBuildTarget
            : (this.isSmartContainer ? this.smartContainerBuildTarget : void 0)
        )

        if (!client && smartContainerBuildTarget) {
          client = smartContainerBuildTarget.name;
        }
        if (!client) {
          const fisrtChild = _.first(this.isSmartContainer ? this.children : this.parent?.children);
          if (fisrtChild) {
            client = fisrtChild.name;
          }
        }
      }
      const shouldGenerateAssetsList = this.isSmartContainer || (this.isStandaloneProject && !this.isSmartContainerTarget);
      // console.log({ shouldGenerateAssetsList })
      if (shouldGenerateAssetsList) {
        if (buildOptions.watch) {
          await this.assetsFileListGenerator.startAndWatch(client, buildOptions.outDir, buildOptions.websql);
        } else {
          await this.assetsFileListGenerator.start(client, buildOptions.outDir, buildOptions.websql);
        }
      }
    };
    //#endregion

    const startCopyToManager = async () => {
      Helpers.info(`${buildOptions.watch ? 'files watch started...' : ''}`);
      Helpers.log(`[buildable-project] Build steps ended (project type: ${this.type}) ... `);

      if (!buildOptions.appBuild) {
        if ((this.isStandaloneProject && this.typeIs('isomorphic-lib')) || this.isSmartContainer) {

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
            await this.copyManager.startAndWatch({ taskName })
          } else {
            await this.copyManager.start({ taskName })
          }
        }
      }

      // console.log('NOT ENABLING WATCHERS')

    }



    if (skipBuild) {
      Helpers.log(`[buildable-project] Skip build for ${this.genericName}`);
      return;
    }
    // console.log('before build steps')
    if (buildOptions.serveApp) {
      await this.buildSteps(buildOptions, async () => {
        await buildAssetsFile();
        await startCopyToManager();
      });
    } else {
      await this.buildSteps(buildOptions);
      if (buildOptions.appBuild) {
        await buildAssetsFile();
      }
      await startCopyToManager();
    }



  }
  //#endregion
}
