//#region imports
import { _ } from 'tnp-core';
import { fse } from 'tnp-core'
import { path } from 'tnp-core'
import { glob } from 'tnp-core';
import { chokidar } from 'tnp-core';

import { config } from 'tnp-config';
import { FeatureCompilerForProject, Project } from '../../abstract';
import { Models } from 'tnp-models';
import { Helpers } from 'tnp-helpers';
import { SourceModForWorkspaceChilds } from './source-mod-for-worspace-childs.backend';
import { IncCompiler } from 'incremental-compiler';
import { SourceModForSite } from './source-mod-for-site.backend';
//#endregion

export function optionsSourceModifier(project: Project): IncCompiler.Models.BaseClientCompilerOptions {
  // console.log('PROJECT', project.name)
  let folderPath: string | string[] = void 0;
  if (project.isWorkspaceChildProject || project.isStandaloneProject) {
    folderPath = [
      path.join(project.location, config.folder.src),
    ]
    if (project.typeIs('angular-lib')) {
      folderPath.push(path.join(project.location, config.folder.components));
    }
    if (project.isSiteInStrictMode) {
      folderPath.push(path.join(project.location, config.folder.custom));
    }
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
export class SourceModifier extends SourceModForSite {

  async preAsyncAction() {
    if (!(this.project.isWorkspaceChildProject || this.project.isStandaloneProject)) {
      return;
    }
    // console.log('INIT PRE ASYNC')
    let pathToWatch: string;
    let prefixTmpFolder = `tmp-src-dist-browser-for-`;

    if (this.project.typeIs('angular-lib')) {
      pathToWatch = config.folder.components;
    } if (this.project.typeIs('isomorphic-lib', 'vscode-ext')) { // TODO all projects with src ?
      pathToWatch = config.folder.src;
    }
    const isStandalone = this.project.isStandaloneProject;
    if (isStandalone) {
      if (this.project.typeIs('angular-lib')) {
        prefixTmpFolder = `tmp-src-dist`;
      } if (this.project.typeIs('isomorphic-lib')) {
        prefixTmpFolder = `tmp-src-dist-browser`;
      }
    }
    // console.log('INIT PRE ASYNC', pathToWatch)
    const childrenNames = this.project.isStandaloneProject ? [] : this.project.parent.childrenThatAreClients.map(p => p.name);
    chokidar.watch([pathToWatch], {
      ignoreInitial: true,
      followSymlinks: false,
      ignorePermissionErrors: true,
      cwd: this.project.location
    })
      .on('unlinkDir', (relativeDir) => {
        // console.log('UNLINK', relativeDir)
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
        Helpers.writeFile(f, Helpers.readFile(f), false);
      }
    }
  }

  @IncCompiler.methods.AsyncAction()
  async asyncAction(event: IncCompiler.Change): Promise<Models.other.ModifiedFiles> {

    const relativePathToProject = event.fileAbsolutePath
      .replace(this.project.location, '')
      .replace(/^\//, '');

    const modifiedFiles: Models.other.ModifiedFiles = { modifiedFiles: [] };

    // Helpers.log(`Source modifer async action for ${relativePathToProject}`)

    this.processFile(relativePathToProject, modifiedFiles);

    if (fse.existsSync(event.fileAbsolutePath)) {
      this.replikatorAction(relativePathToProject, modifiedFiles)
    }
    // console.log(modifiedFiles)
    return modifiedFiles;
  }

  async syncAction(absoluteFilePathes: string[]): Promise<Models.other.ModifiedFiles> {

    Helpers.log(`[sourceModifer][sync] files to check: \n\n${absoluteFilePathes.map(f => `${f}\n`)}\n\n`, 1);

    const modifiedFiles: Models.other.ModifiedFiles = { modifiedFiles: [] };
    // console.log('absoluteFilePathes sm', absoluteFilePathes)

    const relativePathesToProject = absoluteFilePathes.map(absoluteFilePath => {
      return absoluteFilePath
        .replace(this.project.location, '')
        .replace(/^\//, '');
    });

    relativePathesToProject.forEach(relativePathToProject => {
      Helpers.log(`[sourceModifier][syn] ${relativePathToProject}`, 1)
      this.processFile(relativePathToProject, modifiedFiles);
    });

    // console.log(relativePathesToProject)
    // process.exit(0)
    if (!this.project.isStandaloneProject ||
      (this.project.isStandaloneProject && this.project.typeIs('angular-lib'))) {

      Helpers.tryRemoveDir(path.join(this.project.location, config.folder.tempSrc));
      // console.log('for app replikator', relativePathesToProject)
      relativePathesToProject.forEach(relativePathToProject => {
        this.replikatorAction(relativePathToProject, modifiedFiles)
      });
    }
    return modifiedFiles;
  }

  private replikatorAction(relativePathToProject: string, modifiedFiles: Models.other.ModifiedFiles) {
    if (relativePathToProject.startsWith(config.folder.src)) {
      Helpers.log(`[replikatorAction] OK ${relativePathToProject}`, 1);
      const orgAbsolutePath = path.join(this.project.location, relativePathToProject);
      const relativePathToTempSrc = relativePathToProject.replace(/^src/, config.folder.tempSrc);
      const destinationPath = path.join(this.project.location, relativePathToTempSrc);
      // console.log('destinationPath', destinationPath)
      if (Helpers.copyFile(orgAbsolutePath, destinationPath, { modifiedFiles })) {
        // console.log('process tmp file', destinationPath)
        if (fse.existsSync(destinationPath)) {

          this.processFile(relativePathToTempSrc, modifiedFiles);
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
    // input = Helpers.tsCodeModifier.fixApostrphes(input); TODO QUICK_FIX @LAST @UNCOMMENT
    // input = Helpers.tsCodeModifier.fixRegexes(input);
    input = super.process(input, relativePath);
    if (this.project.isWorkspaceChildProject) {
      input = this.modWorkspaceChildrenLibsBetweenItself(input, modType, relativePath);
      input = this.modSiteChildrenLibsInClient(input, modType, relativePath);
    }
    return input;
  }

  async start(taskName?: string, afterInitCallBack?: () => void) {
    if (this.project.isSite) {
      // if(!this.project || !this.project.baseline) {
      //   console.trace('HERE')
      // }
      await this.project.baseline.sourceModifier.start(taskName);
    }
    return super.start(taskName, afterInitCallBack);
  }

  async startAndWatch(taskName?: string, options?: IncCompiler.Models.StartAndWatchOptions) {
    const { watchOnly } = options || {};
    Helpers.log(`Start source modifer for ${this.project.genericName}`)
    if (this.project.isSite) {
      // if(!this.project || !this.project.baseline) {
      //   console.trace('HERE')
      // }
      await this.project.baseline.sourceModifier.startAndWatch(taskName, { watchOnly });
    }
    return super.startAndWatch(taskName, options);
  }

}
