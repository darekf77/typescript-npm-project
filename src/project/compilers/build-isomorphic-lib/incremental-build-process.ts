//#region @backend
import * as path from 'path';
import * as _ from 'lodash';
import * as fse from 'fs-extra';
import chalk from 'chalk';

import { BroswerForModuleCompilation, BackendCompilationExtended } from './compilations';
import { IncrementalBuildProcess, OutFolder } from 'morphi/build';
import { config } from '../../../config';
import { Project } from '../../../project';
import { Helpers } from '../../../helpers';
import { BuildOptions } from '../../features/build-process';

function useDefaultBrowserCompilation(project: Project) {
  if (project.isStandaloneProject && project.type === 'isomorphic-lib') {
    return true;
  }
  if (project.type === 'isomorphic-lib') {
    return _.isUndefined(project.parent.children.find(c => {
      return config.appTypes.includes(c.type);
    }));
  }
  return false;
}


export class IncrementalBuildProcessExtended extends IncrementalBuildProcess {

  private get resolveModulesLocations(): string[] {
    if (this.project.isWorkspaceChildProject) {

      if (_.isArray(this.buildOptions.forClient) && this.buildOptions.forClient.length > 0) {
        return (this.buildOptions.forClient as Project[]).map(c => c.name)
      }

      return this.project.parent.children
        .filter(c => config.allowedTypes.app.includes(c.type))
        .map(c => c.name)
    }
    return [];
  }

  public static getBrowserVerPath(moduleName?: string) {
    if (!moduleName) {
      return config.folder.browser;
    }
    return `${config.folder.browser}-for-${moduleName}`;
  }

  constructor(private project: Project, private buildOptions: BuildOptions) {

    super(buildOptions ? buildOptions.outDir : undefined,
      config && config.folder.src, project && project.location,
      useDefaultBrowserCompilation(project)
    );

    // const useDefaultCompilation = useDefaultBrowserCompilation(project)
    // if (useDefaultCompilation && project.name === 'angular-lib') {
    //   console.log(project.parent.children.map(c => {
    //     return { name: c.genericName, type: c.type }
    //   }))
    //   process.exit(0)
    // }


    const outFolder = buildOptions.outDir;
    const location = project.type === 'isomorphic-lib' ? config.folder.src : config.folder.components;
    const cwd = project.location;

    if (project.type === 'isomorphic-lib') {
      if (project.isSite) {
        this.backendCompilation = new BackendCompilationExtended(outFolder, config.folder.tempSrc, cwd);
      } else {
        this.backendCompilation = new BackendCompilationExtended(outFolder, location, cwd);
      }

    } else {
      this.backendCompilation = void 0;
    }
    // console.log('this.backendCompilation exists ? ', !!this.backendCompilation)
    // console.log('project.type ', project.type)
    // console.log('project.genericName ', project.genericName)
    // process.exit(0)

    if (buildOptions.genOnlyClientCode) {
      if (this.backendCompilation) {
        this.backendCompilation.isEnableCompilation = false;
      }
    }

    this.compileOnce = !buildOptions.watch

    if (buildOptions.onlyBackend) {

      this.browserCompilations = [];

    } else {

      if (project.type === 'isomorphic-lib' && project.isStandaloneProject && !buildOptions.watch) {
        const browser = _.first(this.browserCompilations)
        browser.filesAndFoldesRelativePathes = browser.filesAndFoldesRelativePathes.filter(f => {
          if (f !== 'app.ts') {
            return true;
          }
          const absolutePathToFile = path.join(cwd, browser.sourceOutBrowser, f);
          Helpers.warn(`For static build ${chalk.bold('app.ts')} will be ignored`);
          fse.writeFileSync(absolutePathToFile, '')
          return false;
        })
        // browser.filesAndFoldesRelativePathes = browser.filesAndFoldesRelativePathes.
      }

      this.resolveModulesLocations
        .forEach(moduleName => {
          let browserOutFolder = IncrementalBuildProcessExtended.getBrowserVerPath(moduleName);
          if (outFolder === 'bundle') {
            browserOutFolder = path.join(outFolder, browserOutFolder);
          }

          const proj = this.project.parent.child(moduleName);
          const envConfig = proj.env.config;
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
        })

      // console.log('this.browserCompilation', this.browserCompilations.map(c => c.location))
      // process.exit(0)
    }
  }




}

//#endregion
