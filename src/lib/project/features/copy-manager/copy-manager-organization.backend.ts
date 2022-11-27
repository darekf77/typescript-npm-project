import { config } from "tnp-config";
import { crossPlatformPath, glob, path, _ } from "tnp-core";
import { BuildOptions } from "tnp-db";
import { Helpers } from "tnp-helpers";
import { Models } from "tnp-models";
import { CLASS } from "typescript-class-helpers";
import { Project } from "../../abstract/project/project";
import { CopyMangerHelpers } from "./copy-manager-helpers.backend";
import { CopyManagerStandalone } from "./copy-manager-standalone.backend";

@CLASS.NAME('CopyManagerOrganization')
export class CopyManagerOrganization extends CopyManagerStandalone {
  protected readonly children: Project[] = this.getChildren();

  //#region target project name
  /**
   * target name for organizaiton (smart container) build
   */
  get targetProjName() {
    const target = _.first((this.args || '').split(' ')).replace('/', '')
    return target;
  }
  //#endregion

  //#region target project path
  get targetProjPath() {
    return crossPlatformPath(path.join(
      this.project.location,
      this.outDir,
      this.project.name,
      this.targetProjName,
    ));
  }
  //#endregion

  //#region target project
  get targetProj() {
    return Project.From(this.targetProjPath);
  }
  //#endregion

  //#region init watching
  public initWatching() {
    const monitoredOutDir = this.monitoredOutDir;

    this.initOptions({
      folderPath: [
        monitoredOutDir,
      ],
      folderPathContentCheck: [
        monitoredOutDir
      ]
    })

  }
  //#endregion

  //#region local temp proj path
  get localTempProjPath() {
    const targetProjPath = crossPlatformPath(path.join(
      this.targetProjPath,
      this.tempProjName,
    ));
    return crossPlatformPath(targetProjPath)
  }
  //#endregion

  //#region root package name
  get rootPackageName() {
    const rootPackageName = ((
      _.isString(this.renameDestinationFolder) && this.renameDestinationFolder !== '')
      ? this.renameDestinationFolder
      : `@${this.project.name}`
    );
    return rootPackageName
  }
  //#endregion

  //#region monitored out dir
  get monitoredOutDir(): string {
    const monitorDir: string = crossPlatformPath(path.join(
      this.targetProjPath,
      this.outDir,
      'libs',
    ));
    return monitorDir;
  }
  //#endregion

  //#region get chhildren
  getChildren(): Project[] {
    return [
      this.project.children.find(c => c.name === this.targetProjName),
      ...this.project.children.filter(c => c.name !== this.targetProjName),
    ];
  }
  //#endregion

  //#region initial fix for destination pacakge
  initalFixForDestination(destination: Project): void {

    const destPackageInNodeModules = path.join(
      destination.location,
      config.folder.node_modules,
      this.rootPackageName
    );

    for (let index = 0; index < CopyMangerHelpers.browserwebsqlFolders.length; index++) {
      const currentBrowserFolder = CopyMangerHelpers.browserwebsqlFolders[index];
      const destPackageInNodeModulesBrowser = path.join(destPackageInNodeModules, currentBrowserFolder);

      Helpers.remove(destPackageInNodeModulesBrowser);

      for (let index = 0; index < this.children.length; index++) {
        const c = this.children[index];
        const childDestPackageInNodeModules = path.join(
          destPackageInNodeModules,
          CopyMangerHelpers.childPureName(c)
        );

        const childDestPackageInNodeModulesBrowser = path.join(
          destPackageInNodeModules,
          CopyMangerHelpers.childPureName(c),
          currentBrowserFolder,
        );

        if (Helpers.isSymlinkFileExitedOrUnexisted(childDestPackageInNodeModules)) {
          Helpers.removeFileIfExists(childDestPackageInNodeModules);
        }
        if (!Helpers.exists(childDestPackageInNodeModules)) {
          Helpers.mkdirp(childDestPackageInNodeModules);
        }
        if (Helpers.isSymlinkFileExitedOrUnexisted(childDestPackageInNodeModulesBrowser)) {
          Helpers.removeFileIfExists(childDestPackageInNodeModulesBrowser);
        }
        if (!Helpers.exists(childDestPackageInNodeModulesBrowser)) {
          Helpers.mkdirp(childDestPackageInNodeModulesBrowser);
        }
      }

    }
  }
  //#endregion

  //#region transform map files
  changedJsMapFilesInternalPathesForDebug(
    content: string,
    isBrowser: boolean,
    isForCliDebuggerToWork: boolean,
    filePath: string,
  ): string {

    let toReplaceString2 = isBrowser
      ? `../tmp-libs-for-${this.outDir}/${this.project.name}/projects/${this.project.name}/${config.folder.src}`
      : `../../../tmp-source-${this.outDir}`;

    let toReplaceString1 = `"${toReplaceString2}`;
    const addon = `/libs/(${this.children.map(c => {
      return Helpers.escapeStringForRegEx(CopyMangerHelpers.childPureName(c));
    }).join('|')})`;

    const regex1 = new RegExp(Helpers.escapeStringForRegEx(toReplaceString1) + addon, 'g');
    const regex2 = new RegExp(Helpers.escapeStringForRegEx(toReplaceString2) + addon, 'g');

    if (isBrowser) { // TODO replace browser doesnt make sense ?? - for now yes
      // content = content.replace(regex1, `"./${config.folder.src}`);
      // content = content.replace(regex2, config.folder.src);
    } else {
      content = content.replace(regex1, `"./${config.folder.src}`);
      content = content.replace(regex2, config.folder.src);
    }

    return content;
  }
  //#endregion

}
