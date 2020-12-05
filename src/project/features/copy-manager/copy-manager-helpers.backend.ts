
//#region imports
import * as _ from 'lodash';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as glob from 'glob';
import chalk from 'chalk';
import * as os from 'os';

import { config } from 'tnp-config';
import { Project } from '../../abstract';
import { Models } from 'tnp-models';
import { Helpers } from 'tnp-helpers';;
import { BuildOptions, TnpDB } from 'tnp-db';
import { FeatureForProject } from '../../abstract';
//#endregion

export namespace CopyMangerHelpers {


  export function filterDontCopy(basePathFoldersTosSkip: string[], project: Project) {

    return (src: string, dest: string) => {
      // console.log('src',src)
      const baseFolder = _.first(src.replace(project.location, '')
        .replace(/^\//, '').split('/'));
      if (!baseFolder || baseFolder.trim() === '') {
        return true;
      }
      const isAllowed = _.isUndefined(basePathFoldersTosSkip.find(f => baseFolder.startsWith(f)));
      return isAllowed;
    };

  }

  export function filterOnlyCopy(basePathFoldersOnlyToInclude: string[], project: Project) {

    return (src: string, dest: string) => {
      const baseFolder = _.first(src.replace(project.location, '')
        .replace(/^\//, '').split('/'));
      if (!baseFolder || baseFolder.trim() === '') {
        return true;
      }
      const isAllowed = !_.isUndefined(basePathFoldersOnlyToInclude.find(f => baseFolder.startsWith(f)));
      return isAllowed;
    };

  }

  export function executeCopy(
    sourceLocation: string,
    destinationLocation: string,
    options: Models.other.GenerateProjectCopyOpt,
    project: Project,
  ) {
    const { useTempLocation, filterForBundle, ommitSourceCode, override } = options;
    let tempDestination: string;
    // console.log('useTempLocation',useTempLocation)
    if (useTempLocation) {
      tempDestination = `${os.platform() === 'darwin' ? '/private/tmp' : '/tmp'}/${_.camelCase(destinationLocation)}`;
      if (fse.existsSync(tempDestination)) {
        Helpers.remove(tempDestination);
      }

      Helpers.mkdirp(tempDestination);
      // console.log(`tempDestination: "${tempDestination}"`);
      // process.exit(0)
    } else {
      tempDestination = destinationLocation;
    }

    const sourceFolders = [
      config.folder.src,
      config.folder.components,
      config.folder.custom,
    ];

    const foldersToSkip = [
      ...(filterForBundle ? [
        '.vscode',
        ..._.values(config.tempFolders),
      ] : []),
      ...(project.projectLinkedFiles().map(c => c.relativePath)),
      ...((filterForBundle && ommitSourceCode) ? sourceFolders : []),
      ...(project.isWorkspace ? project.children.map(c => c.name) : [])
    ];

    // console.log(foldersToSkip)

    const filter = override ? CopyMangerHelpers.filterOnlyCopy(sourceFolders, project)
      : CopyMangerHelpers.filterDontCopy(foldersToSkip, project);

    Helpers.copy(`${sourceLocation}/`, tempDestination, { filter });

    if (useTempLocation) {
      Helpers.copy(`${tempDestination}/`, destinationLocation);
      Helpers.remove(tempDestination);
    }

    if (project.isContainerWorkspaceRelated) {
      // console.log(`For project: ${this.project.genericName} files:
      // ${this.project.projectSourceFiles()}
      // `)
      project.projectSourceFiles().forEach(f => {
        const source = path.join(project.location, f);
        if (fse.existsSync(source)) {
          Helpers.log(`Copying file/folder to static build: ${f} `)
          if (fse.lstatSync(source).isDirectory()) {
            Helpers.tryCopyFrom(source, path.join(destinationLocation, f));
          } else {
            Helpers.copyFile(source, path.join(destinationLocation, f));
          }
        } else {
          Helpers.log(`[executeCopy] Doesn not exist source: ${source}`);
        }
      });
    }

  }

}
