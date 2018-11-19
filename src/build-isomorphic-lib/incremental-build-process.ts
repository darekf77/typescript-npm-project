//#region @backend
import * as path from 'path';
import * as _ from 'lodash';
import { BroswerForModuleCompilation, BackendCompilationExtended } from './compilations';
import { IncrementalBuildProcess, OutFolder } from 'morphi/build';
import config from '../config';
import { Project } from '../project';
import { BuildOptions, LibType } from '../models';

export class IncrementalBuildProcessExtended extends IncrementalBuildProcess {

  private get resolveModulesLocations(): string[] {
    if (this.project.isWorkspaceChildProject) {

      if (_.isArray(this.buildOptions.forClient)) {
        return this.buildOptions.forClient.map(c => c.name)
      }

      const res = this.project.parent.children
        .filter(c => config.allowedTypes.app.includes(c.type))
        .map(c => c.name)
    }
    return [];
  }

  constructor(private project: Project, private buildOptions: BuildOptions) {

    super(buildOptions.outDir, config.folder.src, project.location);

    const outFolder = buildOptions.outDir;
    const location = config.folder.src;
    const cwd = project.location;

    this.backendCompilation = new BackendCompilationExtended(outFolder, location, cwd);

    if (buildOptions.genOnlyClientCode) {
      this.backendCompilation.isEnableCompilation = false;
    }

    this.compileOnce = buildOptions.compileOnce;

    // console.log(`this.project.env.config for ${project.name} is `, this.project.env.config)

    this.resolveModulesLocations
      .forEach(moduleName => {
        let browserOutFolder = `${config.folder.browser}-for-${moduleName}`
        if (outFolder === 'bundle') {
          browserOutFolder = path.join(outFolder, browserOutFolder);
        }

        this.browserCompilations.push(
          new BroswerForModuleCompilation(moduleName,
            this.project.env.config,
            `tmp-src-${outFolder}-${browserOutFolder}`,
            browserOutFolder as any,
            location,
            cwd)
        )
      })

  }




}

//#endregion
