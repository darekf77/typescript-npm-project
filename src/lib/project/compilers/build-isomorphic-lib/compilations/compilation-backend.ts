//#region @backend
import {
  _,
  path,
  fse,
  child_process,
  crossPlatformPath,
} from 'tnp-core';
import { Helpers } from 'tnp-helpers'
import { IncCompiler } from 'incremental-compiler';
import { config, ConfigModels } from 'tnp-config';
import { Project } from '../../../abstract/project/project';

export interface TscCompileOptions {
  cwd: string;
  watch?: boolean;
  outDir?: string;
  generateDeclarations?: boolean;
  tsExe?: string;
  diagnostics?: boolean;
  hideErrors?: boolean;
  debug?: boolean;
  locationOfMainProject: string;
  isBrowserBuild?: boolean;
  buildType: 'dist' | 'bundle';
}

@IncCompiler.Class({ className: 'BackendCompilation' })
export class BackendCompilation extends IncCompiler.Base {

  public get compilationFolderPath() {
    if (_.isString(this.location) && _.isString(this.cwd)) {
      return crossPlatformPath(path.join(this.cwd, this.location));
    }
  }
  public isEnableCompilation = true;

  static counter = 1;
  async libCompilation({
    cwd,
    watch = false,
    outDir,
    generateDeclarations = false,
    tsExe = 'npm-run tsc',
    diagnostics = false,
    hideErrors = false,
    locationOfMainProject,
    isBrowserBuild,
    buildType = 'dist'
  }: TscCompileOptions) {
    if (!this.isEnableCompilation) {
      Helpers.log(`Compilation disabled for ${_.startCase(BackendCompilation.name)}`)
      return;
    }
    // let id = BackendCompilation.counter++;
    const project = Project.nearestTo(cwd) as Project;



    if (hideErrors) {
      diagnostics = false;
      generateDeclarations = false;
    }
    // console.log(`starting search for project in: ${cwd}`)

    // console.log(`Project form ${cwd}: ${project?.location}`)

    const params = [
      watch ? ' -w ' : '',
      outDir ? ` --outDir ${outDir} ` : '',
      !watch ? ' --noEmitOnError true ' : '',
      diagnostics ? ' --extendedDiagnostics ' : '',
      ` --preserveWatchOutput `
      // hideErrors ? '' : ` --preserveWatchOutput `,
      // hideErrors ? ' --skipLibCheck true --noEmit true ' : '',
    ];

    let commandJsAndMaps, commandDts;
    if (isBrowserBuild) {
      commandJsAndMaps = `${tsExe} -d false  ${params.join(' ')}`
      commandDts = `${tsExe} ${params.join(' ')}`
    } else {
      const tsconfigBackendPath = crossPlatformPath(
        project.path(`tsconfig.backend.${_.last(outDir.split('/'))}.json`).absolute.normal
      );
      // console.log(`
      // tsconfigBackendPath: ${tsconfigBackendPath}

      // `)

      commandJsAndMaps = `${tsExe} -d false  ${params.join(' ')}   --project ${tsconfigBackendPath}`
      commandDts = `${tsExe} ${params.join(' ')}   --project ${tsconfigBackendPath}`
    }

    // console.log(`

    // STARTING BUILD TYPE (${id}): ${isBrowserBuild ? 'browser' : 'backend'}

    // `,{
    //   cwd,
    //   watch,
    //   outDir,
    //   project: project.location,
    //   locationOfMainProject,
    //   buildType,
    //   generateDeclarations,
    //   commandDts,
    //   commandJsAndMaps
    // })


    Helpers.log(`(${this.compilerName}) Execute first command :

    ${commandJsAndMaps}

    # inside: ${cwd}`)


    if (isBrowserBuild) {
      if (project.frameworkVersionAtLeast('v3')) {
        // nothing here for for now
      } else {
        await this.buildStandardLibVer({
          watch, commandJsAndMaps, commandDts, generateDeclarations, cwd
        });
      }
    } else {

      if (global['useWebpackBackendBuild']) {
        project.webpackBackendBuild.run({
          buildType: 'lib',
          outDir: _.last(outDir.split('/')) as any,
          watch,
          // uglify,
        })
      } else {
        await this.buildStandardLibVer({
          watch, commandJsAndMaps, commandDts, generateDeclarations, cwd
        });
      }
    }

    // console.log(`

    // DONE BUILD TYPE (${id}): ${isBrowserBuild ? 'browser' : 'backend'}

    // `)

  }

  protected async buildStandardLibVer(options: {
    watch: boolean;
    commandJsAndMaps: string;
    commandDts: string,
    generateDeclarations: boolean,
    cwd: string;
  }) {

    const { watch, generateDeclarations, commandDts, commandJsAndMaps, cwd } = options;
    //#region normal js build
    if (watch) {
      await Helpers.logProc2(child_process.exec(commandJsAndMaps, { cwd }), ['Watching for file changes.']);
      if (generateDeclarations) {
        Helpers.log(`(${this.compilerName}) Execute second command : ${commandDts}    # inside: ${cwd}`)
        await Helpers.logProc2(child_process.exec(commandDts, { cwd }), ['Watching for file changes.']);
      }
    } else {
      try {
        child_process.execSync(commandJsAndMaps, {
          cwd,
          stdio: [0, 1, 2]
        });
      } catch (e) {
        Helpers.error(`[${config.frameworkName}] Compilation error (1): ${e}`, false, true);
      }


      if (generateDeclarations) {
        Helpers.log(`(${this.compilerName}) Execute second command : ${commandDts}    # inside: ${cwd}`)
        try {
          child_process.execSync(commandDts, {
            cwd,
            stdio: [0, 1, 2]
          })
        } catch (e) {
          Helpers.error(`[${config.frameworkName}] Compilation error (2): ${e}`, false, true);
        }
      }
    }
    //#endregion
  }

  protected compilerName = 'Backend Compiler';
  async compile(watch = false) {
    await this.libCompilation({
      cwd: this.compilationFolderPath,
      watch,
      outDir: (`../${this.outFolder}` as any),
      generateDeclarations: true,
      locationOfMainProject: this.location,
      buildType: this.outFolder as any
    });
  }

  async syncAction(filesPathes: string[]) {
    const outDistPath = crossPlatformPath(path.join(this.cwd, this.outFolder));
    // Helpers.System.Operations.tryRemoveDir(outDistPath)
    if (!fse.existsSync(outDistPath)) {
      fse.mkdirpSync(outDistPath);
    }
    await this.compile();
  }

  async preAsyncAction() {
    await this.compile(true)
  }

  get tsConfigName() {
    return 'tsconfig.json'
  }
  get tsConfigBrowserName() {
    return 'tsconfig.browser.json'
  }

  constructor(
    /**
     * Output folder
     * Ex. dist
     */
    public outFolder: ConfigModels.OutFolder,
    /**
     * Source location
     * Ex. src | components
     */
    public location: string,
    /**
     * Current cwd same for browser and backend
     * but browser project has own compilation folder
     * Ex. /home/username/project/myproject
     */
    public cwd?: string
  ) {
    super({
      folderPath: [path.join(cwd, location)],
      notifyOnFileUnlink: true,
    });
  }


}



//#endregion
