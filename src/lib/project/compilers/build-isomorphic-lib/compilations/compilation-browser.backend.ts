
//#region imports
import {
  _,
  path,
  fse,
  rimraf,
  crossPlatformPath,
} from 'tnp-core';
import { IncCompiler } from 'incremental-compiler';
import { ConfigModels } from 'tnp-config';
import { Helpers } from 'tnp-helpers';
import { BackendCompilation } from './compilation-backend.backend';
import { BuildOptions } from 'tnp-db';
import type { Project } from '../../../abstract/project/project';
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
  public get compilationFolderPath() {
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
  }
  //#endregion

  //#region methods

  //#region methods / sync action
  async syncAction(files: string[]) {
    // console.log('[compilation browser] syncAction', files)
    Helpers.removeFolderIfExists(this.compilationFolderPath)
    Helpers.mkdirp(this.compilationFolderPath)
    // const dereference = true; // Copy symlinks as normal files
    // console.log(`copying ${path.join(this.cwd, this.location)}/ to  ${this.compilationFolderPath} dereference: ${dereference},`)

    // TODO_NOT_IMPORTANT this may be replaced by filesPathes
    Helpers.copy(`${crossPlatformPath(path.join(this.cwd, this.location))}/`, this.compilationFolderPath, {
      dereference: false,
      filter: (src: string, dest: string) => {
        return copyToBrowserSrcCodition(src);
      }
    })
    // console.log('browser', this.filesAndFoldesRelativePathes.slice(0, 5))

    this.initCodeCut(files)
    // tsconfig.browser.json
    const source = crossPlatformPath(path.join(this.cwd, this.tsConfigBrowserName));
    const dest = crossPlatformPath(path.join(this.cwd, this.sourceOutBrowser, this.tsConfigName));

    fse.copyFileSync(source, dest);
    this.codecut.files();
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
    const relativeFilePath = crossPlatformPath(absoluteFilePath.replace(crossPlatformPath(path.join(this.cwd, this.location)), ''));
    const destinationFilePath = crossPlatformPath(path.join(this.cwd, this.sourceOutBrowser, relativeFilePath));

    // console.log({
    //   absoluteFilePath,
    //   relativeFilePath,
    //   destinationFilePath,
    //   cwd: this.cwd,
    //   location: this.location,
    // })

    if (event.eventName === 'unlinkDir') {
      // console.log('REMOVING DIR', destinationFilePath)
      Helpers.removeFolderIfExists(destinationFilePath);
    } else {
      // console.log(`[compilation-browser][asyncAction][compilations.ts] ${event.eventName} ${event.fileAbsolutePath}`)
      const triggerTsEventExts = Models.other.CutableFileExtArr.map(ext => `.${ext}`);
      if (triggerTsEventExts
        .includes(path.extname(event.fileAbsolutePath))) {
        if (event.eventName === 'unlink') {
          Helpers.removeFileIfExists(destinationFilePath);
          // console.log('FILE UNLINKED')
        } else {
          if (fse.existsSync(absoluteFilePath)) {
            if (!fse.existsSync(path.dirname(destinationFilePath))) {
              Helpers.mkdirp(path.dirname(destinationFilePath));
            }
            if (fse.existsSync(destinationFilePath) && fse.lstatSync(destinationFilePath).isDirectory()) {
              fse.removeSync(destinationFilePath);
            }
            Helpers.copyFile(absoluteFilePath, destinationFilePath);
          }
          // console.log('FILE COPIED')
        }
        // changeAbsoluteFilePathExt(event, 'ts'); // TODO
        // console.log(`AFTER CHAGE: ${event.fileAbsolutePath}`)
      }
      await this.superAsyncAction(event as any);
    }
  }

  async superAsyncAction(event: IncCompiler.Change) {
    // console.log(`[compilation-browser][asyncAction] ${event.eventName} ${event.fileAbsolutePath}`)
    const absoluteFilePath = crossPlatformPath(event.fileAbsolutePath);
    const relativeFilePath = absoluteFilePath.replace(crossPlatformPath(crossPlatformPath(path.join(this.cwd, this.location))), '');
    const destinationFilePath = crossPlatformPath(path.join(
      this.cwd,
      this.sourceOutBrowser,
      relativeFilePath,
    ));
    const destinationFileBackendPath = crossPlatformPath(path.join(
      this.cwd,
      this.sourceOutBrowser.replace('tmp-src', 'tmp-source'),
      relativeFilePath
    ));

    // console.log({
    //   absoluteFilePath,
    //   relativeFilePath,
    //   destinationFilePath,
    //   destinationFileBackendPath,
    //   cwd: this.cwd,
    //   location: this.location,
    // })

    if (event.eventName === 'unlinkDir') {
      // console.log('REMOVING DIR', destinationFilePath)
      // console.log('REMOVING DIR BACKEND', destinationFileBackendPath)
      Helpers.removeFolderIfExists(destinationFilePath);
      Helpers.removeFolderIfExists(destinationFileBackendPath);
    } else {
      // noting here for backend

      // console.log('this.cwd', this.cwd)
      // console.log('this.sourceOutBrowser', this.sourceOutBrowser)
      // console.log('destinationFilePath', destinationFilePath)
      // console.log(`[asyncAction][${config.frameworkName}][cb] relativeFilePath: ${relativeFilePath}`)
      // console.log(`[asyncAction][${config.frameworkName}][cb] destinationFilePath: ${destinationFilePath}`);
      if (copyToBrowserSrcCodition(absoluteFilePath)) {
        if (event.eventName === 'unlink') {
          if (fse.existsSync(destinationFilePath)) {
            fse.unlinkSync(destinationFilePath)
          }
          if (fse.existsSync(destinationFileBackendPath)) {
            fse.unlinkSync(destinationFileBackendPath)
          }

          // console.log('unlink browser', destinationFilePath);
          // console.log('unlink backend', destinationFileBackendPath);

          // if (['module', 'component']
          //   .map(c => `.${c}.ts`)
          //   .filter(c => destinationFilePath.endsWith(c)).length > 0) {
          //   const orgFil = `${destinationFilePath}.orginal`;
          //   if (fse.existsSync(orgFil)) {
          //     fse.unlinkSync(orgFil)
          //   }
          // }
        } else {
          if (fse.existsSync(absoluteFilePath)) {

            if (!fse.existsSync(path.dirname(destinationFilePath))) {
              fse.mkdirpSync(path.dirname(destinationFilePath));
            }
            if (!fse.existsSync(path.dirname(destinationFileBackendPath))) {
              fse.mkdirpSync(path.dirname(destinationFileBackendPath));
            }

            if (fse.existsSync(destinationFilePath) && fse.lstatSync(destinationFilePath).isDirectory()) {
              fse.removeSync(destinationFilePath);
            }
            if (fse.existsSync(destinationFileBackendPath) && fse.lstatSync(destinationFileBackendPath).isDirectory()) {
              fse.removeSync(destinationFileBackendPath);
            }

            fse.copyFileSync(absoluteFilePath, destinationFilePath);
          }
        }
        this.codecut.file(destinationFilePath);
      }
    }

  }
  //#endregion

  //#region methods / compile
  async compile(watch: boolean = false) {
    try {
      await this.libCompilation({
        websql: this.websql,
        cwd: this.compilationFolderPath,
        watch,
        outDir: (`../${this.backendOutFolder}/${this.outFolder}` as any),
        generateDeclarations: true,
        locationOfMainProject: this.cwd,
        isBrowserBuild: true,
        buildType: this.backendOutFolder as any
      });
    } catch (e) {
      Helpers.log(e);
      // console.log(require('callsite-record')({
      //   forError: e
      // }).renderSync({
      //   // stackFilter(frame) {
      //   //   return !frame.getFileName().includes('node_modules');
      //   // }
      // }))
      Helpers.error(`Browser compilation fail: ${e}`, false, true);
    }
  }
  //#endregion

  //#region methods / init code cut
  initCodeCut(filesPathes: string[]) {
    Helpers.log(`[initCodeCut] filesPathes:

    ${filesPathes.map(c => `${c}\n`)}

    `, 1);

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

    filesPathes = filesPathes.map(f => {
      f = crossPlatformPath(f);
      return f.replace(crossPlatformPath(path.join(this.cwd, this.location)), '').replace(/^\//, '');
    });

    Helpers.log(`[initCodeCut] filesPathes after:

    ${filesPathes.map(c => `${c}\n`)}

    `, 1);

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
      this.compilationFolderPath,
      filesPathes,
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

  //#endregion

}

//#region helpers
function copyToBrowserSrcCodition(absoluteFilePath: string) {
  return !absoluteFilePath.endsWith('.spec.ts')
  // && !absoluteFilePath.endsWith('.backend.ts');
}
//#endregion
