//#region @backend
import * as path from 'path';
import * as _ from 'lodash';
import * as fse from 'fs-extra';
import chalk from 'chalk';

import { BroswerForModuleCompilation, BackendCompilationExtended } from './compilations';
import { IncrementalBuildProcess, OutFolder } from 'morphi/build';
import config from '../config';
import { Project } from '../project';
import { BuildOptions, LibType } from '../models';
import { warn } from '../messages';

export class IncrementalBuildProcessExtended extends IncrementalBuildProcess {

  private get resolveModulesLocations(): string[] {
    if (this.project.isWorkspaceChildProject) {

      if (_.isArray(this.buildOptions.forClient) && this.buildOptions.forClient.length > 0) {
        return this.buildOptions.forClient.map(c => c.name)
      }

      return this.project.parent.children
        .filter(c => config.allowedTypes.app.includes(c.type))
        .map(c => c.name)
    }
    return [];
  }

  public static getBrowserVerPath(moduleName: string) {
    return `${config.folder.browser}-for-${moduleName}`;
  }


  constructor(private project: Project, private buildOptions: BuildOptions) {

    super(buildOptions ? buildOptions.outDir : undefined, config && config.folder.src, project && project.location);

    const outFolder = buildOptions.outDir;
    const location = config.folder.src;
    const cwd = project.location;

    this.backendCompilation = new BackendCompilationExtended(outFolder, location, cwd);

    if (buildOptions.genOnlyClientCode) {
      this.backendCompilation.isEnableCompilation = false;
    }

    this.compileOnce = buildOptions.compileOnce;

    if (buildOptions.onlyBackend) {

      this.browserCompilations = [];

    } else {

      if (project.isStandaloneProject && !buildOptions.watch) {
        const browser = _.first(this.browserCompilations)
        browser.filesAndFoldesRelativePathes = browser.filesAndFoldesRelativePathes.filter(f => {
          if (f !== 'app.ts') {
            return true;
          }
          const absolutePathToFile = path.join(cwd, browser.sourceOutBrowser, f);
          warn(`For static build ${chalk.bold('app.ts')} will be ignored`);
          fse.writeFileSync(absolutePathToFile, '')
          return false;
        })
        // browser.filesAndFoldesRelativePathes = browser.filesAndFoldesRelativePathes.
      }

      // console.log(`this.project.env.config for ${project.name} is `, this.project.env.config)
      // console.log('this.resolveModulesLocations', this.resolveModulesLocations)

      this.resolveModulesLocations
        .forEach(moduleName => {
          let browserOutFolder = IncrementalBuildProcessExtended.getBrowserVerPath(moduleName);
          if (outFolder === 'bundle') {
            browserOutFolder = path.join(outFolder, browserOutFolder);
          }

          this.browserCompilations.push(
            new BroswerForModuleCompilation(moduleName,
              this.project.env.config,
              `tmp-src-${outFolder}-${browserOutFolder}`,
              browserOutFolder as any,
              location,
              cwd,
              outFolder)
          )
        })
    }
  }




}

//#endregion
