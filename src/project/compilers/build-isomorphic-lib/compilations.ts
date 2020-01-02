//#region @backend
import * as _ from 'lodash';
import * as path from 'path';
import * as fse from 'fs-extra';

import { BroswerCompilation, OutFolder, BackendCompilation } from 'morphi';
import { Models } from 'tnp-models';
import { Project } from '../../abstract';
import { Helpers } from '../../../helpers';
import { BuildOptions } from '../../features/build-process';
import { ExtendedCodeCut } from './extended-code-cut.backend';
import { IncCompiler } from 'incremental-compiler';

export class BackendCompilationExtended extends BackendCompilation {

  CompilationWrapper = Helpers.compilationWrapper as any;
  compile(watch = false) {

    // QUICK_FIX for backend in ${config.frameworkName} projects
    const currentProject = Project.From(this.cwd);
    const generatedDeclarations = !currentProject.isWorkspaceChildProject;
    this.tscCompilation(this.compilationFolderPath, watch, `../${this.outFolder}` as any, generatedDeclarations);
  }


}

export class BroswerForModuleCompilation extends BroswerCompilation {

  compile(watch: boolean) {
    try {
      super.compile(watch);
    } catch (e) {
      Helpers.error(`Browser compilation fail: ${e}`, false, true);
    }
  }
  get customCompilerName() {

    if (this.ENV) {
      return `Browser Extended compilation for ${this.ENV.currentProjectName}`;
    }
    return `Browser Extended compilation`
  }

  CompilationWrapper = Helpers.compilationWrapper as any;

  @IncCompiler.methods.AsyncAction()
  async asyncAction(event: IncCompiler.Change) {
    const triggerTsEventExts = ['css', 'scss', 'sass', 'html'].map(ext => `.${ext}`);
    if (triggerTsEventExts
      .includes(path.extname(event.fileAbsolutePath))) {

      const absoluteFilePath = event.fileAbsolutePath;
      const relativeFilePath = absoluteFilePath.replace(path.join(this.cwd, this.location), '');
      const destinationFilePath = path.join(this.cwd, this.sourceOutBrowser, relativeFilePath);
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
      changeAbsoluteFilePathExt(event, 'ts');
      // console.log(`AFTER CHAGE: ${event.fileAbsolutePath}`)
    }
    await super.asyncAction(event);
  }

  constructor(
    private compilationProject: Project,
    private moduleName: string,
    public ENV: Models.env.EnvConfig,
    /**
     * tmp-src-for-(dist|bundle)-browser
     */
    sourceOut: string,
    /**
     * browser-for-(dist|bundle|projectName)
     */
    outFolder: OutFolder,
    location: string,
    cwd: string,
    backendOut: string,
    public buildOptions: BuildOptions
  ) {
    super(sourceOut, outFolder, location, cwd, backendOut)
    this.compilerName = this.customCompilerName;
    // console.log('SOURCE OUT', sourceOut)
    // console.log('OUT FOLDER', outFolder)
    // console.log('LOCATION', location)
    // console.log('MODULE NAME', moduleName)
    // console.log(Helpers.terminalLine())
  }

  codeCuttFn(cutIftrue: boolean) {
    return function (expression: string, reservedExpOne: Models.env.EnvConfig, absoluteFilePath?: string) {

      let result = false;

      // console.log(`------------------------`)
      // console.log('cutIftrue', cutIftrue)
      if (!reservedExpOne) {
        // console.log(`No environment`, e)
      } else {
        // console.log({
        //   currentProjectName: e.currentProjectName,
        //   currentProjectLocation: e.currentProjectLocation
        // } as EnvConfig);
        const exp = `(function(ENV){
          // console.log(typeof ENV)
          return ${expression.trim()}
        })(reservedExpOne)`;
        // console.log(`Eval expre

        // ${exp}

        // `);

        try {
          const res = eval(exp);
          // console.log(`[${path.basename(absoluteFilePath)}] Eval (${expression}) => ${res}`)
          result = cutIftrue ? res : !res;
        } catch (err) {
          // console.log(`Expression Failed`, err)
          Helpers.error(`[codecutFn] Eval failed `);
          Helpers.error(err, true, true);
        }
      }
      // console.log(`Finally cut code  ? ${result} for ${path.basename(absoluteFilePath)}`)
      return result;
    }
  }

  initCodeCut(filesPathes: string[]) {

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
      project = Project.From(env.currentProjectLocation);
    }

    if (compilationProject.isStandaloneProject && compilationProject.type === 'angular-lib') {
      project = compilationProject;
    }

    filesPathes = filesPathes.map(f => {
      return f.replace(path.join(this.cwd, this.location), '').replace(/^\//, '');
    })
    // console.log('project', project.name)
    // console.log('compilationProject', compilationProject.name)
    // console.log('filesPathes', filesPathes)
    // process.exit(0)
    this.codecut = new ExtendedCodeCut(
      this.compilationFolderPath,
      filesPathes,
      {
        replacements: [
          ((compilationProject.type === 'isomorphic-lib') && ["@backendFunc", `return undefined;`]) as any,
          ((compilationProject.type === 'isomorphic-lib') && "@backend") as any,
          ["@cutCodeIfTrue", this.codeCuttFn(true)],
          ["@cutCodeIfFalse", this.codeCuttFn(false)]
        ].filter(f => !!f),
        env
      },
      project,
      compilationProject,
      buildOptions,
      this.sourceOutBrowser
    );
    // console.log('here2')
  }


}


function changeAbsoluteFilePathExt(event: IncCompiler.Change, newExtension: string) {
  const ext = newExtension.replace(/^\./, '');
  const oldExt = path.extname(event.fileAbsolutePath).replace(/^\./, '');
  event.fileAbsolutePath = event.fileAbsolutePath
    .replace(new RegExp(`\\.${oldExt}$`), `.${ext}`);
}

//#endregion
