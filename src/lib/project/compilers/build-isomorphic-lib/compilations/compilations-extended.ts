//#region @backend
import { _, crossPlatformPath } from 'tnp-core';
import { path } from 'tnp-core';
import { fse } from 'tnp-core';

import { Models } from 'tnp-models';
import { Project } from '../../../abstract/project/project';
import { Helpers } from 'tnp-helpers';
import { BuildOptions } from 'tnp-db';
import { ExtendedCodeCut } from '../code-cut';
import { IncCompiler } from 'incremental-compiler';
import { JSON10 } from 'json10';
import { config, ConfigModels } from 'tnp-config';
import { codeCuttFn } from '../code-cut';
import { BackendCompilation } from './compilation-backend';
import { BroswerCompilation } from './compilation-browser';

export class BackendCompilationExtended extends BackendCompilation {

  CompilationWrapper = Helpers.compilationWrapper as any;
  async compile(watch = false) {

    // QUICK_FIX for backend in ${config.frameworkName} projects
    const currentProject = Project.From<Project>(this.cwd);
    const generatedDeclarations = !currentProject.isWorkspaceChildProject;

    const hideErrorsForBackend = currentProject.typeIs('angular-lib')
      && this.compilationFolderPath.endsWith(config.folder.components);

    await this.libCompilation
      ({
        cwd: this.compilationFolderPath,
        watch,
        outDir: (`../${this.outFolder}` as any),
        generateDeclarations: generatedDeclarations,
        hideErrors: hideErrorsForBackend,
        locationOfMainProject: this.location,
        buildType: this.outFolder as any
      });
  }


}

export class BroswerForModuleCompilation extends BroswerCompilation {

  async compile(watch: boolean) {
    try {
      await super.compile(watch);
    } catch (e) {
      console.log(require('callsite-record')({
        forError: e
      }).renderSync({
        // stackFilter(frame) {
        //   return !frame.getFileName().includes('node_modules');
        // }
      }))
      Helpers.error(`Browser compilation fail: ${e}`, false, true);
    }
  }
  get customCompilerName() {

    if (this.ENV) {
      return `Browser Extended compilation for ${this.ENV.currentProjectName}`;
    }
    return `Browser Extended compilation`;
  }

  CompilationWrapper = Helpers.compilationWrapper as any;

  @IncCompiler.methods.AsyncAction()
  // @ts-ignore
  async asyncAction(event: IncCompiler.Change) {
    const absoluteFilePath = crossPlatformPath(event.fileAbsolutePath);
    const relativeFilePath = crossPlatformPath(absoluteFilePath.replace(path.join(this.cwd, this.location), ''));
    const destinationFilePath = crossPlatformPath(path.join(this.cwd, this.sourceOutBrowser, relativeFilePath));

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
      await super.asyncAction(event as any);
    }
  }

  constructor(
    public compilationProject: Project,
    public moduleName: string,
    public ENV: Models.env.EnvConfig,
    /**
     * tmp-src-for-(dist|bundle)-browser
     */
    sourceOut: string,
    /**
     * browser-for-(dist|bundle|projectName)
     */
    outFolder: ConfigModels.OutFolder,
    location: string,
    cwd: string,
    backendOut: string,
    public buildOptions: BuildOptions
  ) {
    super(sourceOut, outFolder, location, cwd, backendOut);
    this.compilerName = this.customCompilerName;

    Helpers.log(`[BroswerForModuleCompilation][constructor]

    compilationProject.genericName: ${compilationProject?.genericName}
    compilationProject.type: ${compilationProject?._type}
    ENV?: ${!!ENV}

    cwd: ${cwd}
    sourceOut: ${sourceOut}
    location: ${location}
    backendOut: ${backendOut}

    `, 1);

    Helpers.log(`\n\nbuildOptions: ${JSON10.stringify(buildOptions)}\n\n`, 2);

    // console.log('SOURCE OUT', sourceOut)
    // console.log('OUT FOLDER', outFolder)
    // console.log('LOCATION', location)
    // console.log('MODULE NAME', moduleName)
    // console.log(Helpers.terminalLine())
  }



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

    let project: Project;
    if (env) {
      project = Project.From<Project>(env.currentProjectLocation);
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

    // @ts-ignore
    this.codecut = new ExtendedCodeCut(
      this.compilationFolderPath,
      filesPathes,
      {
        replacements: [
          ['@backendFunc', `return (void 0);`],
          '@backend' as any,
          ['@cutCodeIfTrue', codeCuttFn(true)],
          ['@cutCodeIfFalse', codeCuttFn(false)]
        ].filter(f => !!f),
        env
      },
      project,
      compilationProject,
      buildOptions,
      this.sourceOutBrowser
    );
  }


}


function changeAbsoluteFilePathExt(event: IncCompiler.Change, newExtension: string) {
  const ext = newExtension.replace(/^\./, '');
  const oldExt = path.extname(event.fileAbsolutePath).replace(/^\./, '');
  event.fileAbsolutePath = event.fileAbsolutePath
    .replace(new RegExp(`\\.${oldExt}$`), `.${ext}`);
}

//#endregion
