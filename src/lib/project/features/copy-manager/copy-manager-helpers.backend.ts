
//#region imports
import { _, crossPlatformPath } from 'tnp-core';
import { fse } from 'tnp-core';
import { path } from 'tnp-core';
import { config } from 'tnp-config';
import { Project } from '../../abstract';
import { Models } from 'tnp-models';
import { Helpers } from 'tnp-helpers';;
//#endregion
export namespace CopyMangerHelpers {

  //#region helpers / browser websql folders
  export const browserwebsqlFolders = [
    config.folder.browser,
    config.folder.websql,
  ] as Models.dev.BuildDirBrowser[];
  //#endregion

  //#region helpers / excute copy
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
      tempDestination = `${Helpers.getTempFolder()}/${_.camelCase(destinationLocation)}`;
      if (fse.existsSync(tempDestination)) {
        Helpers.remove(tempDestination);
      }

      Helpers.mkdirp(tempDestination);
      // console.log(`tempDestination: "${tempDestination}"`);
      // process.exit(0)
    } else {
      tempDestination = destinationLocation;
    }
    sourceLocation = crossPlatformPath(sourceLocation);
    tempDestination = crossPlatformPath(tempDestination);
    destinationLocation = crossPlatformPath(destinationLocation);

    const sourceFolders = [
      config.folder.src,
      config.folder.components,
      config.folder.custom,
    ];

    // const toOmmitV3 = ((project.frameworkVersionAtLeast('v3') && project.typeIs('isomorphic-lib')) ? ['app', 'lib'] : []);

    const foldersToSkip = [
      ...(filterForBundle ? [
        '.vscode',
        ...Helpers.values(config.tempFolders),
      ] : []),
      ...(project.projectLinkedFiles().map(c => c.relativePath)),
      ...((filterForBundle && ommitSourceCode) ? sourceFolders : []),
      // ...toOmmitV3,
    ];

    // console.log(foldersToSkip)

    const filter = override ? Helpers.filterOnlyCopy(sourceFolders, project)
      : Helpers.filterDontCopy(foldersToSkip, project);

    Helpers.copy(`${sourceLocation}/`, tempDestination, { filter, dereference: options.dereference });

    if (useTempLocation) {
      Helpers.copy(`${tempDestination}/`, destinationLocation, { dereference: options.dereference });
      Helpers.remove(tempDestination);
    }

    if (project.isContainerWorkspaceRelated) {
      // console.log(`For project: ${this.project.genericName} files:
      // ${this.project.projectSourceFiles()}
      // `)
      project.projectSourceFiles().forEach(f => {
        const source = crossPlatformPath(path.join(project.location, f));
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
  //#endregion

  //#region helpers / fix dts import

  export function fixDtsImport(
    content: string,
    browserFolder: Models.dev.BuildDirBrowser,
    isomorphicPackages: string[],
  ) {

    content = content ? content : '';

    // if(path.basename(filepath) === 'framework-context.d.ts') {
    //   debugger
    // }

    for (let index = 0; index < isomorphicPackages.length; index++) {
      const isomorphicPackageName = isomorphicPackages[index];
      content = (content || '').replace(
        new RegExp(Helpers.escapeStringForRegEx(`import("${isomorphicPackageName}"`), 'g'),
        `import("${isomorphicPackageName}/${browserFolder}"`);
    }

    return content;
  }
  //#endregion

  //#region helpers / pure child name
  export function childPureName(child: Project) {
    return child.name.startsWith('@') ? child.name.split('/')[1] : child.name; // pure name
  }
  //#endregion

  //#region helpers / fix d.ts import files in folder
  /**
   *  fixing d.ts for (dist|bundle)/(browser|websql) when destination local project
   * @param distOrBuneleOrPkgFolder usually dist
   * @param isTempLocalProj
   */
  export function fixingDtsImports(distOrBuneleOrPkgFolder: string, isomorphicPackages: string[]) {

    for (let index = 0; index < CopyMangerHelpers.browserwebsqlFolders.length; index++) {

      const currentBrowserFolder = CopyMangerHelpers.browserwebsqlFolders[index];
      Helpers.log('Fixing .d.ts. files start...');
      const sourceBrowser = path.join(distOrBuneleOrPkgFolder, currentBrowserFolder);
      const browserDtsFiles = Helpers.filesFrom(sourceBrowser, true)
        .filter(f => f.endsWith('.d.ts'));

      for (let index = 0; index < browserDtsFiles.length; index++) {
        const dtsFileAbsolutePath = browserDtsFiles[index];
        writeFixedVersionOfDtsFile(dtsFileAbsolutePath, currentBrowserFolder, isomorphicPackages);
      }
      Helpers.log('Fixing .d.ts. files done.');
    }
  }

  export function writeFixedVersionOfDtsFile(
    dtsFileAbsolutePath: string,
    currentBrowserFolder: Models.dev.BuildDirBrowser,
    isomorphicPackages: string[],
  ) {
    if (!dtsFileAbsolutePath.endsWith('.d.ts')) {
      return;
    }
    const dtsFileContent = Helpers.readFile(dtsFileAbsolutePath);
    const dtsFixedContent = CopyMangerHelpers.fixDtsImport(
      dtsFileContent,
      // dtsFileAbsolutePath,
      currentBrowserFolder,
      isomorphicPackages
    );
    if (dtsFixedContent.trim() !== dtsFileContent.trim()) {
      Helpers.writeFile(dtsFileAbsolutePath, dtsFixedContent);
    }
  }

  //#endregion

}
