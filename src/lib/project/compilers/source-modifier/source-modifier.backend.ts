//#region imports
import { _ } from 'tnp-core/src';
import { fse } from 'tnp-core/src'
import { path } from 'tnp-core/src'
import { config } from 'tnp-config/src';
import { Project } from '../../abstract';
import { Models } from 'tnp-models/src';
import { Helpers } from 'tnp-helpers/src';
import { COMPILER_POOLING, IncCompiler, incrementalWatcher } from 'incremental-compiler/src';
import { SourceModForStandaloneProjects } from './source-mod-for-standalone-projects.backend';

//#endregion

const IS_ENABLE = false; // TODO UNCOMMENT

export function optionsSourceModifier(project: Project): IncCompiler.Models.BaseClientCompilerOptions {
  // console.log('PROJECT', project.name)
  let folderPath: string | string[] = void 0;
  if (project.isStandaloneProject) {
    folderPath = [
      path.join(project.location, config.folder.src),
    ];
  }
  const options: IncCompiler.Models.BaseClientCompilerOptions = {
    folderPath,
  };
  // if (project.isStandaloneProject) {
  //   console.log(`${project.genericName}: optionsSourceModifier`, options)
  // }
  // if (project.name === 'simple-lib') {
  //   console.log('optionsSourceModifier', options)
  // }
  return options;
}


@IncCompiler.Class({ className: 'SourceModifier' })
export class SourceModifier extends SourceModForStandaloneProjects {

  async preAsyncAction() {
    if (!IS_ENABLE) {
      return;
    }
    if (!(this.project.isStandaloneProject)) {
      return;
    }
    // console.log('INIT PRE ASYNC')
    let pathToWatch: string;
    let prefixTmpFolder = `tmp-src-dist-browser-for-`;


    if (this.project.typeIs('isomorphic-lib', 'vscode-ext')) { // TODO all projects with src ?
      pathToWatch = config.folder.src;
    }
    const isStandalone = this.project.isStandaloneProject;
    if (isStandalone) {
      if (this.project.typeIs('isomorphic-lib')) {
        prefixTmpFolder = `tmp-src-dist-browser`;
      }
    }
    // console.log('INIT PRE ASYNC', pathToWatch)
    const childrenNames = this.project.isStandaloneProject ? [] : this.project.parent.childrenThatAreLibs.map(p => p.name);
    (await incrementalWatcher([pathToWatch], {
      name: 'FIREDEV SOURCE MODIFIER',
      ignoreInitial: true,
      followSymlinks: false,
      cwd: this.project.location,
      ...COMPILER_POOLING,
    }))
      .on('unlinkDir', (relativeDir) => {
        // console.log('FIREDEV SOURCE MODIFIER EVENT')
        relativeDir = relativeDir.split('/').slice(1).join('/');
        if (isStandalone) {
          const checkDelete = path.join(
            this.project.location,
            prefixTmpFolder,
            relativeDir
          );
          Helpers.removeFolderIfExists(checkDelete);
        } else {
          for (let index = 0; index < childrenNames.length; index++) {
            const checkDelete = path.join(
              this.project.location,
              `${prefixTmpFolder}${childrenNames[index]}`,
              relativeDir
            );
            Helpers.removeFolderIfExists(checkDelete);
          }
        }
      })
      .on('addDir', (relativeDir) => {
        // console.log('ADD DIR', relativeDir)
        const folderAdded = path.join(
          this.project.location,
          relativeDir
        );
        this.reSaveAllFilesIn(folderAdded);
      });
  }

  private reSaveAllFilesIn(folderPath) {
    const files = fse.readdirSync(folderPath);
    for (let index = 0; index < files.length; index++) {
      const f = path.join(folderPath, files[index]);
      if (fse.lstatSync(f).isDirectory()) {
        this.reSaveAllFilesIn(f);
      } else {
        Helpers.writeFile(f, Helpers.readFile(f), { overrideSameFile: true });
      }
    }
  }

  @IncCompiler.methods.AsyncAction()
  async asyncAction(event: IncCompiler.Change) {
    if (!IS_ENABLE) {
      return;
    }
    if (event.eventName !== 'unlinkDir') {


      const relativePathToProject = event.fileAbsolutePath
        .replace(this.project.location, '')
        .replace(/^\//, '');


      // Helpers.log(`Source modifer async action for ${relativePathToProject}`)

      this.processFile(relativePathToProject, void 0, this.websql);

      if (fse.existsSync(event.fileAbsolutePath)) {
        this.replikatorAction(relativePathToProject)
      }
    }
  }

  async syncAction(absoluteFilePathes: string[]) {
    if (!IS_ENABLE) {
      return;
    }
    Helpers.log(`[sourceModifer][sync] files to check: \n\n${absoluteFilePathes.map(f => `${f}\n`)}\n\n`, 1);

    // console.log('absoluteFilePathes sm', absoluteFilePathes)

    const relativePathesToProject = absoluteFilePathes.map(absoluteFilePath => {
      return absoluteFilePath
        .replace(this.project.location, '')
        .replace(/^\//, '');
    });

    relativePathesToProject.forEach(relativePathToProject => {
      Helpers.log(`[sourceModifier][syn] ${relativePathToProject}`, 1)
      this.processFile(relativePathToProject, void 0, this.websql);
    });

    // console.log(relativePathesToProject)
    // process.exit(0)
    if (!this.project.isStandaloneProject) {
      Helpers.tryRemoveDir(path.join(this.project.location, config.folder.tempSrc));
      // console.log('for app replikator', relativePathesToProject)
      relativePathesToProject.forEach(relativePathToProject => {
        this.replikatorAction(relativePathToProject)
      });
    }
  }

  private replikatorAction(relativePathToProject: string) {
    if (relativePathToProject.startsWith(config.folder.src)) {
      Helpers.log(`[replikatorAction] OK ${relativePathToProject}`, 1);
      const orgAbsolutePath = path.join(this.project.location, relativePathToProject);
      const relativePathToTempSrc = relativePathToProject.replace(/^src/, config.folder.tempSrc);
      const destinationPath = path.join(this.project.location, relativePathToTempSrc);
      // console.log('destinationPath', destinationPath)
      if (Helpers.copyFile(orgAbsolutePath, destinationPath)) {
        // console.log('process tmp file', destinationPath)
        if (fse.existsSync(destinationPath)) {

          this.processFile(relativePathToTempSrc, void 0, this.websql);
        }
      } else {
        // console.log('WRONG process tmp file', destinationPath)
      }
    } else {
      Helpers.log(`[replikatorAction] not start with src ${relativePathToProject}`, 1);
    }
  }

  process(input: string, relativePath: string) {

    const modType = this.getModType(this.project, relativePath);
    // Helpers.log(`[sourceModifier][process] modType: ${modType}, relative path: ${relativePath}`);
    // if (modType === 'tmp-src-for') {
    //   console.log(relativePath);
    //   // return input;
    // }
    // console.log(`modType: ${modType}, relatiePath: ${relativePath}`)
    // input = Helpers.tsCodeModifier.fixApostrphes(input); TODO QUICK_FIX @UNCOMMENT
    // input = Helpers.tsCodeModifier.fixRegexes(input);
    input = super.process(input, relativePath);
    return input;
  }

  async start(options?: IncCompiler.Models.StartOptions) {
    if (!IS_ENABLE) {
      return;
    }
    return super.start(options);
  }

  async startAndWatch(options?: IncCompiler.Models.StartAndWatchOptions) {
    if (!IS_ENABLE) {
      return;
    }
    Helpers.log(`Start source modifer for ${this.project.genericName}`)
    return super.startAndWatch(options);
  }

}
