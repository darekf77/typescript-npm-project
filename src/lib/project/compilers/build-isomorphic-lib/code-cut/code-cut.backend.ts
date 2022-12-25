//#region imports
import { crossPlatformPath, path, _ } from "tnp-core";
import { BuildOptions } from "tnp-db";
import { PREFIXES } from "tnp-helpers";
import { Models } from "tnp-models";
import type { Project } from "../../../abstract/project/project";
import { BrowserCodeCut } from "./browser-code-cut.backend";
//#endregion

export class CodeCut {

  //#region fields
  readonly browserCodeCut: BrowserCodeCut;
  //#endregion

  //#region constructor
  constructor(
    protected cwd: string,
    protected filesPathes: string[],
    protected options: Models.dev.ReplaceOptionsExtended,
    /**
     * it may be not available for global, for all compilatoin
     */
    private project: Project,
    private compilationProject: Project,
    private buildOptions: BuildOptions,
    public sourceOutBrowser: string,

  ) {

  }
  //#endregion

  //#region methods
  files() {
    // console.log('options in fiels', this.options)
    this.filesPathes.forEach((relativePathToFile) => {
      const absolutePathToFile = crossPlatformPath(path.join(this.cwd, relativePathToFile))
      // console.log('process', absolutePathToFile)
      this.file(absolutePathToFile);
    })
  }

  file(absolutePathToFile) {
    if (path.basename(absolutePathToFile).search(PREFIXES.BASELINE) !== -1 ||
      path.basename(absolutePathToFile).search(PREFIXES.DELETED) !== -1
    ) {
      return;
    }

    return (new BrowserCodeCut(
      absolutePathToFile,
      this.project,
      this.compilationProject,
      this.buildOptions,
      this.sourceOutBrowser
    ))
      .readFiles()
      .REPLACERegionsForIsomorphicLib(_.cloneDeep(this.options) as any)
      .FLATTypescriptImportExport('export')
      .FLATTypescriptImportExport('import')
      .REPLACERegionsFromTsImportExport('export')
      .REPLACERegionsFromTsImportExport('import')
      .REPLACERegionsFromJSrequire()
      .save();
  }

  //#endregion
}

