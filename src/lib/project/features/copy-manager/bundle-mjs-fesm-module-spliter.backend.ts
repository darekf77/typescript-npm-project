import { _ } from 'tnp-core';
import { Helpers } from "tnp-helpers";
import { Project } from "../../abstract";

export class MjsModule {
  static KEY_END_MODULE_FILE = '@--end--of-file-for-module=';
  static EXPORT_STRING = 'export {';
  constructor(
    public contentLines: string[],
    public startIndex: number,
    public endIndex: number,
    public childModuleName: string,
  ) { }
}
export class BundleMjsFesmModuleSpliter {

  static fixForTarget(smartContainerChild: Project, mjsFileAbsPath: string) {
    return (new BundleMjsFesmModuleSpliter(smartContainerChild, mjsFileAbsPath)).process();
  }

  private readonly content: string;
  private readonly contentLines: string[];


  private constructor(
    private smartContainerChild: Project,
    private mjsFileAbsPath: string,
  ) {
    this.content = Helpers.readFile(mjsFileAbsPath) || '';
    this.contentLines = this.content.split(/\r?\n/);
  }

  indexFirstImportIndex: number;
  indexLastImportIndex: number;
  indexLastCode: number;
  modules: MjsModule[] = [];

  private searchForBeginModulesIndexs() {
    this.indexFirstImportIndex = this.contentLines.findIndex(line => this.lineIsImport(line));
    if (this.indexFirstImportIndex < 0) {
      this.indexFirstImportIndex = 0;
      this.indexLastImportIndex = 0;
      return;
    }
    let index = this.indexFirstImportIndex;
    while (index < this.contentLines.length) {
      const line = this.contentLines[index];
      if (this.lineIsImport(line)) {
        this.indexLastImportIndex = index;
      } else {
        return;
      }
      index++;
    }
  }

  private searchForModules() {
    let index = this.indexLastImportIndex;
    let lastStartIndex = index;
    let lastModuleName = '';
    const regexEndOfFile = /\@\-\-end\-of\-file\-for\-module\=[a-z0-9|\-|\.|\-]+/;
    while (index < this.contentLines.length) {
      const line = this.contentLines[index];
      if (line.trim().startsWith(MjsModule.EXPORT_STRING)) {
        break;
      }
      if (line.search(MjsModule.KEY_END_MODULE_FILE) !== -1) {
        const [__, childName] = _.first(line.match(regexEndOfFile)).split('=');
        lastModuleName = childName;
        this.modules.push(new MjsModule(this.contentLines, lastStartIndex, index, childName))
        this.indexLastImportIndex = index;
      }
      index++;
    }
    if ((this.indexLastImportIndex > 0) && (this.indexLastImportIndex < this.contentLines.length)) {
      this.modules.push(new MjsModule(
        this.contentLines,
        this.indexLastImportIndex,
        this.contentLines.length,
        lastModuleName,
      ));
    }
  }

  replaceExportForSpecyficTarget() {

  }

  process(): string {
    if (!this.content) {
      return;
    }
    this.searchForBeginModulesIndexs()
    this.searchForModules();
    this.replaceExportForSpecyficTarget();

    // @LAST delete module , fix exports
  }

  private lineIsImport(line: string) {
    return line.trim().startsWith('import {') || line.trim().startsWith('import *');
  }

}
