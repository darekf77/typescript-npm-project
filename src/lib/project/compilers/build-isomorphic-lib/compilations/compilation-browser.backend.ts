//#region imports
import {
  _,
  path,
  fse,
  rimraf,
  crossPlatformPath,
} from 'tnp-core';
import { IncCompiler } from 'incremental-compiler';
import { config, ConfigModels } from 'tnp-config';
import { Helpers } from 'tnp-helpers';
import { BackendCompilation } from './compilation-backend.backend';
import { BuildOptions } from 'tnp-db';
import { Project } from '../../../abstract/project/project';
import { Models } from 'tnp-models';
import { JSON10 } from 'json10';
import { CodeCut } from '../code-cut/code-cut.backend';
import { codeCuttFn } from '../code-cut/cut-fn.backend';
import { CLASS } from 'typescript-class-helpers';
//#endregion

@IncCompiler.Class({ className: 'BroswerCompilation' })
export class BroswerCompilation extends BackendCompilation {

  private static instances = {} as { [websql: string]: BroswerCompilation; }

  //#region fields & getters
  compilerName = 'Browser standard compiler'
  public codecut: CodeCut;

  /**
   * ex: <project-path>/tmp-src-dist
   */
  public get absPathTmpSrcDistBundleFolder() {
    if (_.isString(this.sourceOutBrowser) && _.isString(this.cwd)) {
      return crossPlatformPath(path.join(this.cwd, this.sourceOutBrowser));
    }
  }
  get customCompilerName() {

    if (this.ENV) {
      return `Browser compilation for ${this.ENV.currentProjectName}`;
    }
    return `Browser compilation`;
  }

  CompilationWrapper = Helpers.compilationWrapper as any;
  //#endregion

  //#region constructor
  readonly project: Project;
  constructor(
    isWatchBuild: boolean,
    public compilationProject: Project,
    public moduleName: string,
    public ENV: Models.env.EnvConfig,
    /**
     * tmp-src-for-(dist|bundle)-browser
     */
    protected sourceOutBrowser: string,
    /**
     * browser-for-(dist|bundle|projectName)
     */
    outFolder: ConfigModels.OutFolder,
    location: string,
    cwd: string,
    public backendOutFolder: string,
    public buildOptions: BuildOptions
  ) {
    super(isWatchBuild, outFolder, location, cwd, buildOptions.websql);
    BroswerCompilation.instances[String(!!buildOptions.websql)] = this;
    this.compilerName = this.customCompilerName;

    Helpers.log(`[BroswerCompilation][constructor]

    compilationProject.genericName: ${compilationProject?.genericName}
    compilationProject.type: ${compilationProject?._type}
    ENV?: ${!!ENV}

    cwd: ${cwd}
    sourceOut: ${sourceOutBrowser}
    location: ${location}
    backendOut: ${backendOutFolder}

    `, 1);

    Helpers.log(`\n\nbuildOptions: ${JSON10.stringify(buildOptions)}\n\n`, 2);

    // console.log('SOURCE OUT', sourceOut)
    // console.log('OUT FOLDER', outFolder)
    // console.log('LOCATION', location)
    // console.log('MODULE NAME', moduleName)
    // console.log(Helpers.terminalLine())
    this.project = Project.From(this.cwd) as Project;
  }
  //#endregion

  //#region methods

  //#region methods / sync action
  async syncAction(absFilesFromSrc: string[]) {

    // console.log('[compilation browser] syncAction', absFileFromSrc)
    Helpers.removeFolderIfExists(this.absPathTmpSrcDistBundleFolder);
    Helpers.mkdirp(this.absPathTmpSrcDistBundleFolder);

    this.initCodeCut();
    this.copyTsConfig();

    const filesBase = crossPlatformPath(path.join(this.cwd, this.srcFolder))
    const relativePathesToProcess = absFilesFromSrc.map(absFilePath => {
      return absFilePath.replace(`${filesBase}/`, '');
    });

    //#region copy core asset files
    if (!this.project.isSmartContainerTarget) {
      const corepro = Project.by('isomorphic-lib', this.project._frameworkVersion) as Project;
      const coreAssetsPath = corepro.pathFor('app/src/assets');
      const filesToCopy = Helpers.filesFrom(coreAssetsPath, true);
      for (let index = 0; index < filesToCopy.length; index++) {
        const fileAbsPath = crossPlatformPath(filesToCopy[index]);
        const relativeFilePath = fileAbsPath.replace(`${coreAssetsPath}/`, '');
        const destAbsPath = crossPlatformPath(path.join(
          this.absPathTmpSrcDistBundleFolder,
          'assets',
          relativeFilePath,
        ));
        Helpers.copyFile(fileAbsPath, destAbsPath);
      }
    }
    //#endregion

    this.codecut.files(relativePathesToProcess);
    await this.compile();
  }
  //#endregion

  //#region methods / async action
  @IncCompiler.methods.AsyncAction()
  async asyncAction(event: IncCompiler.Change) {

    if (!this.buildOptions.websql) { // TODO QUICK_FIX QUICK_DIRTY_FIX
      const websqlInstance = BroswerCompilation.instances[String(!this.buildOptions.websql)];
      await websqlInstance.asyncAction(event);
    }

    const absoluteFilePath = crossPlatformPath(event.fileAbsolutePath);
    const relativeFilePath = crossPlatformPath(absoluteFilePath.replace(`${crossPlatformPath(path.join(this.cwd, this.srcFolder))}/`, ''));
    if (path.basename(relativeFilePath) === '.DS_Store') {
      return;
    }

    const destinationFilePath = crossPlatformPath(path.join(this.cwd, this.sourceOutBrowser, relativeFilePath));
    const destinationFileBackendPath = crossPlatformPath(path.join(
      this.cwd,
      this.sourceOutBrowser.replace('tmp-src', 'tmp-source'),
      relativeFilePath
    ));

    if (event.eventName === 'unlinkDir') {
      Helpers.removeFolderIfExists(destinationFilePath);
      Helpers.removeFolderIfExists(destinationFileBackendPath);
    } else {
      if (this.isNotASpecFileCondition(absoluteFilePath)) {
        if (event.eventName === 'unlink') {
          if (relativeFilePath.startsWith(`${config.folder.assets}/`)) {
            this.codecut.files([relativeFilePath], true);
          } else {
            Helpers.removeFileIfExists(destinationFilePath);
            Helpers.removeFileIfExists(destinationFileBackendPath);
          }
        } else {
          if (fse.existsSync(absoluteFilePath)) {
            //#region mkdirp basedir
            if (!fse.existsSync(path.dirname(destinationFilePath))) {
              fse.mkdirpSync(path.dirname(destinationFilePath));
            }
            if (!fse.existsSync(path.dirname(destinationFileBackendPath))) {
              fse.mkdirpSync(path.dirname(destinationFileBackendPath));
            }
            //#endregion

            //#region remove deist if directory
            if (fse.existsSync(destinationFilePath) && fse.lstatSync(destinationFilePath).isDirectory()) {
              fse.removeSync(destinationFilePath);
            }
            if (fse.existsSync(destinationFileBackendPath) && fse.lstatSync(destinationFileBackendPath).isDirectory()) {
              fse.removeSync(destinationFileBackendPath);
            }
            //#endregion

            this.codecut.files([relativeFilePath]);
          }
        }

      }
    }
  }
  //#endregion

  //#region methods / compile
  async compile(watch: boolean = false) {
    try {
      await this.libCompilation({
        websql: this.websql,
        cwd: this.absPathTmpSrcDistBundleFolder,
        watch,
        outDir: (`../${this.backendOutFolder}/${this.outFolder}` as any),
        generateDeclarations: true,
        locationOfMainProject: this.cwd,
        isBrowserBuild: true,
        buildType: this.backendOutFolder as any
      });
    } catch (e) {
      console.log(e);
      // console.log(require('callsite-record')({
      //   forError: e
      // }).renderSync({
      //   // stackFilter(frame) {
      //   //   return !frame.getFileName().includes('node_modules');
      //   // }
      // }))
      Helpers.error(`Browser compilation fail`, false, true);
    }
  }
  //#endregion

  //#region methods / init code cut
  initCodeCut() {

    // console.log('inside')
    let env: Models.env.EnvConfig = this.ENV;
    const compilationProject: Project = this.compilationProject;
    const buildOptions = this.buildOptions;
    if (!compilationProject) {
      return;
    }
    env = _.cloneDeep(env);
    this.ENV = env;
    // console.log('here1')

    const ProjectClass = CLASS.getBy('Project') as typeof Project;
    let project: Project;
    if (env) {
      project = ProjectClass.From<Project>(env.currentProjectLocation);
    }

    if (compilationProject.isStandaloneProject) {
      project = compilationProject;
    }


    const replacements = [];

    replacements.push(['@backe' + 'ndFunc', `return (void 0);`]);
    replacements.push('@bac' + 'kend' as any);

    if (!this.buildOptions.websql) {
      replacements.push('@web' + 'sqlOnly' as any,);
      replacements.push(['@websq' + 'lFunc', `return (void 0);`]);
      replacements.push('@we' + 'bsql' as any,);
    }

    replacements.push(['@cutCode' + 'IfTrue', codeCuttFn(true)]);
    replacements.push(['@cutCod' + 'eIfFalse', codeCuttFn(false)]);

    this.codecut = new CodeCut(
      this.absPathTmpSrcDistBundleFolder,
      {
        replacements: replacements.filter(f => !!f),
        env
      },
      project,
      compilationProject,
      buildOptions,
      this.sourceOutBrowser
    );
  }
  //#endregion


  private copyTsConfig() {
    //#region copy tsconfig
    const source = crossPlatformPath(path.join(this.cwd, this.tsConfigBrowserName));
    const dest = crossPlatformPath(path.join(this.cwd, this.sourceOutBrowser, this.tsConfigName));
    Helpers.copyFile(source, dest);
    //#endregion
  }


  public isNotASpecFileCondition(absoluteFilePath: string) {
    return !absoluteFilePath.endsWith('.spec.ts')
  }

  public isNotFromAssets(absoluteFilePath: string, base: string) {
    absoluteFilePath = crossPlatformPath(absoluteFilePath);
    const relativePath = absoluteFilePath.replace(`${base}/`, '');
    // console.log({ relativePath })
    return !relativePath.startsWith('assets/');
  }


  //#endregion

}
