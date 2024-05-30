import { config } from 'tnp-config/src';
import { crossPlatformPath, path } from 'tnp-core/src';
import { Helpers } from 'tnp-helpers/src';
import { CopyMangerHelpers } from './copy-manager-helpers.backend';

export const TS_NOCHECK = '// @ts-nocheck';

/**
 * 1, import('') fixes for
 * - browser
 * - websql
 * 2. @dts nocheck fix at beginngin
 * - browser
 * - websql
 * - nodejs
 */
export class TypescriptDtsFixer {
  //#region singleton
  public static for(isomorphicPackages: string[]) {
    return new TypescriptDtsFixer(isomorphicPackages);
  }

  private constructor(protected readonly isomorphicPackages: string[] = []) {}
  //#endregion

  //#region helpers / fix dts import

  forContent(content: string, browserFolder: 'browser' | 'websql' | string) {
    content = content ? content : '';

    // if(path.basename(filepath) === 'framework-context.d.ts') {
    //   debugger
    // }
    const isomorphicPackages = this.isomorphicPackages;
    for (let index = 0; index < isomorphicPackages.length; index++) {
      const isomorphicPackageName = isomorphicPackages[index];
      content = (content || '').replace(
        new RegExp(
          Helpers.escapeStringForRegEx(`import("${isomorphicPackageName}"`),
          'g',
        ),
        `import("${isomorphicPackageName}/${browserFolder}"`,
      );
    }

    if (!content.trimLeft().startsWith(TS_NOCHECK)) {
      content = `${TS_NOCHECK}\n${content}`;
    }

    return content;
  }
  //#endregion

  //#region helpers / fix d.ts import files in folder
  /**
   *  fixing d.ts for (dist)/(browser|websql) when destination local project
   * @param absPathFolderLocationWithBrowserAdnWebsql usually dist
   * @param isTempLocalProj
   */
  processFolderWithBrowserWebsqlFolders(
    absPathFolderLocationWithBrowserAdnWebsql: string,
  ) {
    // console.log({ absPathFolderLocation: absPathFolderLocationWithBrowserAdnWebsql })

    for (
      let index = 0;
      index < CopyMangerHelpers.browserwebsqlFolders.length;
      index++
    ) {
      const currentBrowserFolder =
        CopyMangerHelpers.browserwebsqlFolders[index];
      Helpers.log('Fixing .d.ts. files start...');
      const sourceBrowser = crossPlatformPath(
        path.join(
          absPathFolderLocationWithBrowserAdnWebsql,
          currentBrowserFolder,
        ),
      );
      this.processFolder(sourceBrowser, currentBrowserFolder);
      Helpers.log('Fixing .d.ts. files done.');
    }
  }

  processFolder(
    absPathLocation: string,
    currentBrowserFolder: 'browser' | 'websql' | string,
  ) {
    const browserDtsFiles = Helpers.filesFrom(absPathLocation, true).filter(f =>
      f.endsWith('.d.ts'),
    );

    for (let index = 0; index < browserDtsFiles.length; index++) {
      const dtsFileAbsolutePath = browserDtsFiles[index];
      this.forFile(dtsFileAbsolutePath, currentBrowserFolder);
    }
  }

  //#endregion

  //#region write fixed version of dts file
  forFile(
    dtsFileAbsolutePath: string,
    currentBrowserFolder: 'browser' | 'websql' | string,
  ) {
    if (!dtsFileAbsolutePath.endsWith('.d.ts')) {
      return;
    }
    // console.log({ dtsFileAbsolutePath })

    const dtsFileContent = Helpers.readFile(dtsFileAbsolutePath);
    const dtsFixedContent = this.forContent(
      dtsFileContent,
      // dtsFileAbsolutePath,
      currentBrowserFolder,
    );
    if (dtsFixedContent.trim() !== dtsFileContent.trim()) {
      Helpers.writeFile(dtsFileAbsolutePath, dtsFixedContent);
    }
  }

  //#endregion
}
