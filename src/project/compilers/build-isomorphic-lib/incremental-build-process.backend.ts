import * as path from 'path';
import * as _ from 'lodash';
import * as fse from 'fs-extra';
import chalk from 'chalk';

import { BroswerForModuleCompilation, BackendCompilationExtended } from './compilations';
import { IncrementalBuildProcess } from 'morphi';
import { config } from '../../../config';
import { Project } from '../../../project';
import { Helpers } from 'tnp-helpers';
import { BuildOptions } from 'tnp-db';

export class IncrementalBuildProcessExtended extends IncrementalBuildProcess {

  protected browserCompilations: BroswerForModuleCompilation[];

  //#region resolve modules from Location
  private get resolveModulesLocations(): string[] {
    if (this.project.isWorkspaceChildProject || (this.project.isStandaloneProject && this.project.isGenerated)) {

      if (_.isArray(this.buildOptions.forClient) && this.buildOptions.forClient.length > 0) {
        return (this.buildOptions.forClient as any[]).map((c: Project) => c.name)
      }
      const parent = this.project.isStandaloneProject ? this.project.grandpa : this.project.parent;

      return parent.children
        .filter(c => c.typeIs(...config.allowedTypes.app))
        .map(c => c.name);
    }
    return [];
  }
  //#endregion

  constructor(private project: Project, private buildOptions: BuildOptions) {

    super(
      buildOptions?.outDir as any,
      config?.folder.src,
      project?.location,
      false,
    );

    Helpers.log(`[incremental-build-process] for project: ${project.genericName}`)

    //#region init variables
    this.compileOnce = !buildOptions.watch
    const outFolder = buildOptions.outDir;
    const location = ((project.typeIs('isomorphic-lib')) ?
      (project.isSiteInStrictMode ? config.folder.tempSrc : config.folder.src)
      : config.folder.components);
    const cwd = project.location;
    const projectIsFromSinglularBuild = (this.project.isStandaloneProject && this.project.isGenerated);
    //#region parent project
    /**
     * For 'watch:dist' build inside container (with standalone childs) or workspace (with workspace childs)
     * I am taking 'gradpa' project... to get this container or workspace
     *
     * For normal workspace build I am taking just parent
     */
    const parentProj = projectIsFromSinglularBuild ? this.project.grandpa : this.project.parent;
    //#endregion
    Helpers.log(`[incremental-build-process]  this.project.grandpa: ${this.project.grandpa?.genericName} `);
    Helpers.log(`[incremental-build-process]  this.project.parent: ${this.project.parent?.genericName} `);
    Helpers.log(`[incremental-build-process] parentProj: ${parentProj?.genericName} `);
    //#endregion

    //#region int backend compilation
    if (project.typeIs('isomorphic-lib')) {
      if (project.isSiteInStrictMode) {
        this.backendCompilation = new BackendCompilationExtended(outFolder as any, config.folder.tempSrc, cwd);
      } else {
        this.backendCompilation = new BackendCompilationExtended(outFolder as any, location, cwd);
      }
    } else {
      this.backendCompilation = void 0;
    }
    Helpers.log(`[incremental-build-process] this.backendCompilation exists: ${!!this.backendCompilation}`);

    if (buildOptions.genOnlyClientCode) {
      if (this.backendCompilation) {
        this.backendCompilation.isEnableCompilation = false;
      }
    }
    if (buildOptions.onlyBackend) {
      this.browserCompilations = [];
      return;
    }
    //#endregion

    //#region making sure that there is environemnt generated for project
    this.resolveModulesLocations
      .forEach(moduleName => {
        const proj = parentProj.child(moduleName);
        let envConfig = proj.env.config;
        if (!envConfig) {
          Helpers.info(`\n\n\n(QUICKFIX) INITINT ${proj.genericName}\n\n\n`)
          proj.run(`${config.frameworkName} struct`).sync();
        }
      });
    //#endregion

    //#region modular build
    const modularBuild = () => {
      if (parentProj.isContainer) {
        const moduleName = '';
        const envConfig = {} as any;
        let browserOutFolder = Helpers.getBrowserVerPath(moduleName);
        if (outFolder === 'bundle') {
          browserOutFolder = path.join(outFolder, browserOutFolder);
        }
        this.browserCompilations = [
          new BroswerForModuleCompilation(
            this.project,
            moduleName,
            envConfig,
            `tmp-src-${outFolder}-${browserOutFolder}`,
            browserOutFolder as any,
            location,
            cwd,
            outFolder,
            buildOptions
          )
        ];
      } else {
        this.resolveModulesLocations
          .forEach(moduleName => {
            let browserOutFolder = Helpers.getBrowserVerPath(moduleName);
            if (outFolder === 'bundle') {
              browserOutFolder = path.join(outFolder, browserOutFolder);
            }

            const proj = parentProj.child(moduleName);
            let envConfig = proj.env.config;
            if (!envConfig) {
              Helpers.error(`[incrementalBuildProcess] Please "tnp init" project: ${proj.genericName}`, false, true);
            }

            this.browserCompilations.push(
              new BroswerForModuleCompilation(
                this.project,
                moduleName,
                envConfig,
                `tmp-src-${outFolder}-${browserOutFolder}`,
                browserOutFolder as any,
                location,
                cwd,
                outFolder,
                buildOptions)
            )
          });
      }
    };
    //#endregion

    if (project.isStandaloneProject) {
      if (project.isGenerated) {
        modularBuild();
      } else {
        let browserOutFolder = Helpers.getBrowserVerPath();
        this.browserCompilations = [
          new BroswerForModuleCompilation(
            this.project,
            void 0,
            void 0,
            `tmp-src-${outFolder}`,
            browserOutFolder as any,
            location,
            cwd,
            outFolder,
            buildOptions)
        ]
      }
    } else {
      modularBuild();
    }

    const compilationsInfo = this.browserCompilations
      .map(c => `compilationProject: ${c.compilationProject?.name}, location: ${c.location}`).join('\n');

    Helpers.log(`BROWSER COMPILATIONS (length: ${this.browserCompilations.length} )`
      + `\n\n` + compilationsInfo + `\n\n`);

  }


}
