//#region imports
import { IncCompiler } from "incremental-compiler";
import { config, ConfigModels } from "tnp-config";
import { child_process, crossPlatformPath, fse, path, _ } from "tnp-core";
import { Helpers } from "tnp-helpers";
import { Models } from "tnp-models";
import { CLASS } from "typescript-class-helpers";
import type { Project } from "../../../abstract/project";
//#endregion

@IncCompiler.Class({ className: 'BackendCompilation' })
export class BackendCompilation extends IncCompiler.Base {

  //#region static
  static counter = 1;
  //#endregion

  //#region fields & getters
  CompilationWrapper = Helpers.compilationWrapper as any;
  public isEnableCompilation = true;
  protected compilerName = 'Backend Compiler';
  get tsConfigName() {
    return 'tsconfig.json'
  }
  get tsConfigBrowserName() {
    return 'tsconfig.browser.json'
  }
  public get absPathTmpSrcDistBundleFolder() {
    if (_.isString(this.srcFolder) && _.isString(this.cwd)) {
      return crossPlatformPath(path.join(this.cwd, this.srcFolder));
    }
  }
  //#endregion

  //#region constructor
  constructor(
    public isWatchBuild: boolean,
    /**
     * Output folder
     * Ex. dist
     */
    public outFolder: ConfigModels.OutFolder,
    /**
     * Source location
     * Ex. src | components
     */
    public srcFolder: string,
    /**
     * Current cwd same for browser and backend
     * but browser project has own compilation folder
     * Ex. /home/username/project/myproject
     */
    public cwd?: string,
    public websql: boolean = false

  ) {
    super({
      folderPath: [path.join(cwd, srcFolder)],
      notifyOnFileUnlink: true,
    });
  }
  //#endregion

  //#region methods
  async compile(watch = false) {

    const ProjectClass = CLASS.getBy('Project') as typeof Project;
    // QUICK_FIX for backend in ${config.frameworkName} projects
    const currentProject = ProjectClass.From<Project>(this.cwd);
    const generatedDeclarations = !currentProject.isWorkspaceChildProject;

    const hideErrorsForBackend = currentProject.typeIs('angular-lib')
      && this.absPathTmpSrcDistBundleFolder.endsWith(config.folder.components);

    await this.libCompilation
      ({
        cwd: this.absPathTmpSrcDistBundleFolder,
        websql: this.websql,
        watch,
        outDir: (`../${this.outFolder}` as any),
        generateDeclarations: generatedDeclarations,
        hideErrors: hideErrorsForBackend,
        locationOfMainProject: this.srcFolder,
        buildType: this.outFolder as any
      });
  }


  async syncAction(filesPathes: string[]) {
    const outDistPath = crossPlatformPath(path.join(this.cwd, this.outFolder));
    // Helpers.System.Operations.tryRemoveDir(outDistPath)
    if (!fse.existsSync(outDistPath)) {
      fse.mkdirpSync(outDistPath);
    }
    await this.compile(this.isWatchBuild);
  }

  async libCompilation({
    cwd,
    websql = false, // TODO ? hmmm this is not needed here
    watch = false,
    outDir,
    generateDeclarations = false,
    tsExe = 'npm-run tsc',
    diagnostics = false,
    hideErrors = false,
    isBrowserBuild,
  }: Models.dev.TscCompileOptions) {
    if (!this.isEnableCompilation) {
      Helpers.log(`Compilation disabled for ${_.startCase(BackendCompilation.name)}`)
      return;
    }
    // let id = BackendCompilation.counter++;
    const ProjectClass = CLASS.getBy('Project') as typeof Project;
    const project = ProjectClass.nearestTo(cwd) as Project;
    const buildOutDir = _.last(outDir.split('/')) as Models.dev.BuildDir;

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

    let cmd = (specificTsconfig?: string) => {
      let commandJs, commandMaps, commandDts;
      const nocutsrcFolder = `${project.location}/${buildOutDir}-nocutsrc`;
      // commandJs = `${tsExe} -d false  --mapRoot ${nocutsrc} ${params.join(' ')} `
      //   + (specificTsconfig ? `--project ${specificTsconfig}` : '');

      commandJs = `${tsExe} --mapRoot ${nocutsrcFolder} ${params.join(' ')} `
        + (specificTsconfig ? `--project ${specificTsconfig}` : '');

      // commandDts = `${tsExe} --emitDeclarationOnly  ${params.join(' ')}`;
      params[1] = ` --outDir ${nocutsrcFolder}`;
      commandMaps = `${tsExe} ${params.join(' ')} `;
      return {
        commandJs, commandMaps,
        // commandDts
      }
    };

    let tscCommands = {} as {
      commandJs: string; commandMaps: string;
      // commandDts: string;
    };

    if (isBrowserBuild) {
      tscCommands = cmd() // DEPRACATED
    } else {
      const tsconfigBackendPath = crossPlatformPath(
        project.path(`tsconfig.backend.${buildOutDir}.json`).absolute.normal
      );
      tscCommands = cmd(tsconfigBackendPath)
    }

    // console.log(tscCommands)

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


    // Helpers.log(`(${this.compilerName}) Execute first command :

    // ${commandJsAndMaps}

    // # inside: ${cwd}`)

    if (isBrowserBuild) {
      if (project.frameworkVersionAtLeast('v3')) {
        // nothing here for for now
      } else {
        await this.buildStandardLibVer({
          watch, ...tscCommands, generateDeclarations, cwd, project, buildOutDir, websql
        });
      }
    } else {

      if (global['useWebpackBackendBuild']) {
        project.webpackBackendBuild.run({
          buildType: 'lib',
          outDir: buildOutDir as any,
          watch,
          // uglify,
        })
      } else {
        await this.buildStandardLibVer({
          watch, ...tscCommands, generateDeclarations, cwd, project, buildOutDir, websql
        });
      }
    }

    // console.log(`

    // DONE BUILD TYPE (${id}): ${isBrowserBuild ? 'browser' : 'backend'}

    // `)

  }

  protected async buildStandardLibVer(options: {
    watch: boolean;
    commandJs: string;
    commandMaps: string;
    websql: boolean;
    // commandDts: string,
    generateDeclarations: boolean,
    cwd: string;
    project: Project;
    buildOutDir: Models.dev.BuildDir | 'browser',
  }) {


    const { watch, generateDeclarations,
      //  commandDts,
      commandJs,
      commandMaps,
      cwd,
      project,
      buildOutDir,
      websql
    } = options;

    const isStandalone = (!project.isSmartContainerTarget && !project.isWorkspace && !project.isSmartContainerChild);
    const parent = !isStandalone ? (project.parent || project.smartContainerTargetParentContainer) : void 0;

    Helpers.info(`

Starting backend typescirpt build....

    `)
    const additionalReplace = (line: string) => {

      if (!parent) {
        return line;
      }
      const beforeModule = crossPlatformPath(path.join(
        parent.location,
        buildOutDir,
        parent.name,
        project.name,
        `tmp-source-${buildOutDir}/libs`
      ));

      if (line.search(beforeModule)) {
        const [__, filepath] = line.split(`'`);
        // console.log({
        //   filepath
        // })
        if (filepath) {
          const moduleName = _.first(filepath.replace(beforeModule + '/', '').split('/'));
          if (moduleName) {
            return line.replace(
              crossPlatformPath(path.join(beforeModule, moduleName)),
              `./${path.join(moduleName, 'src/lib')}`
            )
          }
        }
      }



      return line;
    }
    // console.log({ isStandalone, buildOutDir })
    //#region normal js build
    // if (watch) {
    await Helpers.execute(child_process.exec(commandJs, { cwd }),
      {
        exitOnError: true,
        exitOnErrorCallback: async (code) => {
          Helpers.error(`[${config.frameworkName}] Typescript compilation (backend) error (code=${code})`
            , false, true);
        },
        outputLineReplace: (line: string) => {
          if (isStandalone) {
            return additionalReplace(line.replace(
              `../tmp-source-${buildOutDir}/`,
              `./src/`
            ));
          } else {
            line = line.trimLeft();
            // console.log({ line })
            if (line.startsWith('./src/libs/')) {
              const [__, ___, moduleName] = line.split('/');
              return additionalReplace(line.replace(
                `./src/libs/${moduleName}/`,
                `./${moduleName}/src/lib/`,
              ));
            } else if (line.startsWith(`../tmp-source-${buildOutDir}/libs/`)) {
              const [__, ___, ____, moduleName] = line.split('/');
              return additionalReplace(line.replace(
                `../tmp-source-${buildOutDir}/libs/${moduleName}/`,
                `./${moduleName}/src/lib/`,
              ));
            } else if (line.startsWith(`../tmp-source-${buildOutDir}/`)) {
              return additionalReplace(line.replace(
                `../tmp-source-${buildOutDir}/`,
                `./${project.name}/src/`,
              ));

            } else {
              return additionalReplace(line.replace(
                `./src/`,
                `./${project.name}/src/lib/`
              ));
            }
          }
        },
        resolvePromiseMsg: {
          stdout: ['Watching for file changes.']
        }
      });

    Helpers.info(`* Typescirpt compilation first part done (${buildOutDir} build). ${websql ? '[WEBSQL]' : ''} `)

    await Helpers.execute(child_process.exec(commandMaps, { cwd }),
      {
        hideOutput: {
          stderr: true,
          stdout: true,
        },
        resolvePromiseMsg: {
          stdout: ['Watching for file changes.']
        }
      });
    Helpers.info(`* Typescirpt compilation second part done (${buildOutDir}  build).  ${websql ? '[WEBSQL]' : ''} `)
    // if (generateDeclarations) {
    //   Helpers.log(`(${this.compilerName}) Execute second command : ${commandDts}    # inside: ${cwd}`)
    //   await Helpers.logProc2(child_process.exec(commandDts, { cwd }), ['Watching for file changes.']);
    // }
    // } else {
    //   try {
    //     child_process.execSync(commandJs, {
    //       cwd,
    //       stdio: [0, 1, 2]
    //     });
    //   } catch (e) {
    //     Helpers.error(`[${config.frameworkName}] Compilation error (1): ${e}`, false, true);
    //   }

    //   try {
    //     child_process.execSync(commandMaps, {
    //       cwd,
    //       stdio: [0, 1, 2]
    //     });
    //   } catch (e) {
    //     Helpers.error(`[${config.frameworkName}] Compilation error (1): ${e}`, false, true);
    //   }

    // if (generateDeclarations) {
    //   Helpers.log(`(${this.compilerName}) Execute second command : ${commandDts}    # inside: ${cwd}`)
    //   try {
    //     child_process.execSync(commandDts, {
    //       cwd,
    //       stdio: [0, 1, 2]
    //     })
    //   } catch (e) {
    //     Helpers.error(`[${config.frameworkName}] Compilation error (2): ${e}`, false, true);
    //   }
    // }
    // }
    //#endregion
  }
  //#endregion

}
