//#region imports
import { path, crossPlatformPath } from 'tnp-core/src'
import { _ } from 'tnp-core/src';

import { config } from 'tnp-config/src';
import type { Project } from '../../../../project/abstract/project/project';
import { Helpers } from 'tnp-helpers/src';
import { BuildOptions } from 'tnp-db/src';
import { BackendCompilation } from './compilation-backend.backend';
import { BroswerCompilation } from './compilation-browser.backend';
import { IncCompiler } from 'incremental-compiler/src';
import { CLI } from 'tnp-cli/src';
//#endregion

export class IncrementalBuildProcess {

  //#region fields & getters
  protected compileOnce = false;
  protected backendCompilation: BackendCompilation;
  protected browserCompilations: BroswerCompilation[];


  //#region constructor
  constructor(
    private project: Project,
    private buildOptions: BuildOptions,
  ) {
    Helpers.log(`[incremental-build-process] for project: ${project.genericName}`)

    //#region init variables
    this.compileOnce = !buildOptions.watch
    const outFolder = buildOptions.outDir;
    const location = config.folder.src;
    const cwd = project.location;

    Helpers.log(`[incremental-build-process]  this.project.grandpa: ${this.project.grandpa?.genericName} `);
    Helpers.log(`[incremental-build-process]  this.project.parent: ${this.project.parent?.genericName} `);
    Helpers.log(`[incremental-build-process] parentProj: ${project?.parent?.genericName} `);
    //#endregion

    //#region int backend compilation
    if (project.typeIs('isomorphic-lib')) {
      this.backendCompilation = new BackendCompilation(
        buildOptions.watch,
        outFolder,
        location,
        cwd,
        this.buildOptions.websql,
      );
    } else {
      this.backendCompilation = new BackendCompilation(
        buildOptions.watch,
        outFolder,
        location,
        cwd,
        this.buildOptions.websql,
      );
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


    if (project.isStandaloneProject) {

      let browserOutFolder = Helpers.getBrowserVerPath(void 0, this.buildOptions.websql);
      this.browserCompilations = [
        new BroswerCompilation(
          buildOptions.watch,
          this.project,
          void 0,
          void 0,
          `tmp-src-${outFolder}${this.buildOptions.websql ? '-websql' : ''}`,
          browserOutFolder as any,
          location,
          cwd,
          outFolder,
          buildOptions)
      ]
    } else if (project?.parent.isContainer) {
      const moduleName = '';
      const envConfig = {} as any;
      let browserOutFolder = Helpers.getBrowserVerPath(moduleName, this.buildOptions.websql);

      if (outFolder === 'bundle') {
        browserOutFolder = crossPlatformPath(path.join(outFolder, browserOutFolder));
      }
      this.browserCompilations = [
        new BroswerCompilation(
          buildOptions.watch,
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
    }

    const compilationsInfo = this.browserCompilations
      .map(c => `compilationProject: ${c.compilationProject?.name}, location: ${c.srcFolder}`).join('\n');

    Helpers.log(`BROWSER COMPILATIONS (length: ${this.browserCompilations.length} )`
      + `\n\n` + compilationsInfo + `\n\n`);

  }
  //#endregion

  //#region  methods
  protected browserTaksName(taskName: string, bc: BroswerCompilation) {
    return `browser ${taskName} in ${path.basename(bc.absPathTmpSrcDistBundleFolder)}`
  }

  protected backendTaskName(taskName) {
    return `${taskName} in ${path.basename(this.backendCompilation.absPathTmpSrcDistBundleFolder)}`
  }

  private recreateBrowserLinks(bc: BroswerCompilation) {
    const outDistPath = crossPlatformPath(path.join(bc.cwd, bc.outFolder));
    Helpers.log(`recreateBrowserLinks: outDistPath: ${outDistPath}`)
    Helpers.removeFolderIfExists(outDistPath)
    const targetOut = crossPlatformPath(path.join(bc.cwd, bc.backendOutFolder, bc.outFolder))
    Helpers.log(`recreateBrowserLinks: targetOut: ${targetOut}`)
    Helpers.createSymLink(targetOut, outDistPath, { continueWhenExistedFolderDoesntExists: true });
  }

  async start(taskName?: string, afterInitCallBack?: () => void) {
    if (!this.compileOnce) {
      this.compileOnce = true;
    }

    for (let index = 0; index < this.browserCompilations.length; index++) {
      const browserCompilation = this.browserCompilations[index];
      await browserCompilation.start({
        taskName: this.browserTaksName(taskName, browserCompilation),
        afterInitCallBack: () => {
          this.recreateBrowserLinks(browserCompilation)
        }
      })
    }

    if (this.backendCompilation) {
      await this.backendCompilation.start({
        taskName: this.backendTaskName(taskName)
      })
    }

    if (_.isFunction(afterInitCallBack)) {
      await Helpers.runSyncOrAsync(afterInitCallBack);
    }
  }

  // @ts-ignore
  async startAndWatch(taskName?: string, options?: IncCompiler.Models.StartAndWatchOptions) {

    // console.log('[${config.frameworkName}][incremental-build-process] taskName' + taskName)

    const { watchOnly, afterInitCallBack } = options || {};
    if (this.compileOnce && watchOnly) {
      console.error(`[${config.frameworkName}] Dont use "compileOnce" and "watchOnly" options together.`);
      process.exit(0)
    }
    if (this.compileOnce) {
      Helpers.log('Watch compilation single run')
      await this.start(taskName, afterInitCallBack);
      process.exit(0);
    }
    if (watchOnly) {
      Helpers.log(CLI.chalk.gray(
        `Watch mode only for "${taskName}"` +
        ` -- morphi only starts starAndWatch anyway --`
      ));
    } else {
      // THIS IS NOT APPLIED FOR TSC
      // await this.start(taskName, afterInitCallBack);
    }

    for (let index = 0; index < this.browserCompilations.length; index++) {
      const browserCompilation = this.browserCompilations[index];
      await browserCompilation.startAndWatch({
        taskName: this.browserTaksName(taskName, browserCompilation),
        afterInitCallBack: () => {
          this.recreateBrowserLinks(browserCompilation)
        },
        watchOnly,
      })
    };

    if (this.backendCompilation) {
      // @ts-ignore
      await this.backendCompilation.startAndWatch(this.backendTaskName(taskName), { watchOnly })
    }

    if (_.isFunction(afterInitCallBack)) {
      await Helpers.runSyncOrAsync(afterInitCallBack);
    }
  }

  //#endregion

}
