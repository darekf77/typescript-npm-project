//#region imports
import { IncCompiler } from "incremental-compiler/src";
import { CLI } from "tnp-cli/src";
import { config, ConfigModels } from "tnp-config/src";
import { crossPlatformPath, fse, path, _ } from "tnp-core/src";
import { Helpers } from "tnp-helpers/src";
import { Models } from "tnp-models/src";
import { CLASS } from "typescript-class-helpers/src";
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
  public get absPathTmpSrcDistFolder() {
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
      followSymlinks: true,
    });
  }
  //#endregion

  //#region methods

  //#region methods / compile
  async compile(watch = false) {

    await this.libCompilation
      ({
        cwd: this.cwd,
        watch,
        outDir: this.outFolder as any,
        generateDeclarations: true,
      });
  }
  //#endregion

  //#region methods / sync action
  async syncAction(filesPathes: string[]) {
    const outDistPath = crossPlatformPath(path.join(this.cwd, this.outFolder));
    // Helpers.System.Operations.tryRemoveDir(outDistPath)
    if (!fse.existsSync(outDistPath)) {
      fse.mkdirpSync(outDistPath);
    }
    await this.compile(this.isWatchBuild);
  }
  //#endregion

  //#region methods / lib compilation
  async libCompilation({
    cwd,
    watch = false,
    outDir,
    generateDeclarations = false,
    tsExe = 'npm-run tsc',
    diagnostics = false,
  }: Models.dev.TscCompileOptions) {
    if (!this.isEnableCompilation) {
      Helpers.log(`Compilation disabled for ${_.startCase(BackendCompilation.name)}`)
      return;
    }
    // let id = BackendCompilation.counter++;
    const ProjectClass = CLASS.getBy('Project') as typeof Project;
    const project = ProjectClass.nearestTo(cwd) as Project;


    const paramsNoWatch = [
      outDir ? ` --outDir ${outDir} ` : '',
      !watch ? ' --noEmitOnError true ' : '',
      diagnostics ? ' --extendedDiagnostics ' : '',
      ` --preserveWatchOutput `
    ];

    const params = [
      watch ? ' -w ' : '',
      ...paramsNoWatch,
      // hideErrors ? '' : ` --preserveWatchOutput `,
      // hideErrors ? ' --skipLibCheck true --noEmit true ' : '',
    ];

    let cmd = (specificTsconfig?: string) => {
      let commandJs, commandMaps, commandJsOrganizationInitial, commandDts;
      const nocutsrcFolder = `${project.location}/${outDir}-nocutsrc`;
      // commandJs = `${tsExe} -d false  --mapRoot ${nocutsrc} ${params.join(' ')} `
      //   + (specificTsconfig ? `--project ${specificTsconfig}` : '');

      commandJs = `${tsExe} --mapRoot ${nocutsrcFolder} ${params.join(' ')} `
        + (specificTsconfig ? `--project ${specificTsconfig}` : '');

      commandJsOrganizationInitial = `${tsExe} --mapRoot ${nocutsrcFolder} ${paramsNoWatch.join(' ')} `
        + (specificTsconfig ? `--project ${specificTsconfig}` : '');

      // commandDts = `${tsExe} --emitDeclarationOnly  ${params.join(' ')}`;
      params[1] = ` --outDir ${nocutsrcFolder}`;
      commandMaps = `${tsExe} ${params.join(' ').replace('--noEmitOnError true', '--noEmitOnError false')} `;
      return {
        commandJs, commandMaps, commandJsOrganizationInitial,
        // commandDts
      }
    };

    let tscCommands = {} as {
      commandJs: string; commandJsOrganizationInitial: string, commandMaps: string;
    };

    const tsconfigBackendPath = crossPlatformPath(
      project.path(`tsconfig.backend.${outDir}.json`).absolute.normal
    );
    tscCommands = cmd(tsconfigBackendPath)

    if (global['useWebpackBackendBuild']) {
      // project.webpackBackendBuild.run({ // TODO
      //   buildType: 'lib',
      //   outDir: buildOutDir as any,
      //   watch,
      //   // uglify,
      // })
    } else {
      await this.buildStandardLibVer({
        watch, ...tscCommands, generateDeclarations, cwd, project, outDir,
      });
    }
  }

  //#endregion

  protected async buildStandardLibVer(options: {
    watch: boolean;
    commandJs: string;
    commandMaps: string;
    commandJsOrganizationInitial: string,
    generateDeclarations: boolean,
    cwd: string;
    project: Project;
    outDir: Models.dev.BuildDir;
  }) {

    let {
      commandJs,
      commandMaps,
      cwd,
      project,
      outDir,
      watch,
    } = options;

    const isStandalone = (!project.isSmartContainerTarget && !project.isSmartContainerChild);
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
        outDir,
        parent.name,
        project.name,
        `tmp-source-${outDir}/libs`
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

    await Helpers.execute(commandJs, cwd,
      {
        exitOnError: true,
        exitOnErrorCallback: async (code) => {
          Helpers.error(`[${config.frameworkName}] Typescript compilation (backend) error (code=${code})`
            , false, true);
        },
        outputLineReplace: (line: string) => {
          if (isStandalone) {
            if (line.startsWith(`tmp-source-${outDir}/`)) {
              return additionalReplace(line.replace(
                `tmp-source-${outDir}/`,
                `./src/`,
              ));
            }

            return additionalReplace(line.replace(
              `../tmp-source-${outDir}/`,
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
            } else if (line.startsWith(`../tmp-source-${outDir}/libs/`)) {
              const [__, ___, ____, moduleName] = line.split('/');
              return additionalReplace(line.replace(
                `../tmp-source-${outDir}/libs/${moduleName}/`,
                `./${moduleName}/src/lib/`,
              ));
            } else if (line.startsWith(`../tmp-source-${outDir}/`)) {
              return additionalReplace(line.replace(
                `../tmp-source-${outDir}/`,
                `./${project.name}/src/`,
              ));

            } else if (line.startsWith(`tmp-source-${outDir}/libs/`)) {
              const [__, ___, moduleName] = line.split('/');
              return additionalReplace(line.replace(
                `tmp-source-${outDir}/libs/${moduleName}/`,
                `./${moduleName}/src/lib/`,
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
          stdout: ['Found 0 errors. Watching for file changes']
        }
      });

    Helpers.log(`* Typescirpt compilation first part done (${outDir} build)`)

    await Helpers.execute(commandMaps, cwd,
      {
        hideOutput: {
          stderr: true,
          stdout: true,
        },
        resolvePromiseMsg: {
          stdout: ['Watching for file changes.']
        }
      });
    Helpers.log(`* Typescirpt compilation second part done (${outDir}  build). `)
    //#endregion
    if (watch) {
      // console.log(Helpers.terminalLine());
      Helpers.info(`




    ${CLI.chalk.bold('YOU CAN ATTACH YOUR BACKEND/NODEJS CODE DEBUGGER NOW')}





    `);
      // console.log(Helpers.terminalLine());
    }

  }
  //#endregion

}
