import { _ } from 'tnp-core';
import { Helpers } from "tnp-helpers";
import { Project } from "../../abstract";
import { SourceMappingUrl } from './source-maping-url.backend';

export class MjsModule {
  //#region static
  static readonly KEY_END_MODULE_FILE = '@--end-of-file-for-module=';
  static readonly EXPORT_STRING = 'export {';
  static readonly COMMENTS = ['*/', '/*', '*']
  static readonly EXPORT_STRING_END = ' };';
  static EXPORT_STRING_ALL = 'export *';
  //#endregion

  //#region constructor
  constructor(
    public contentLines: string[],
    public startIndexes: number[],
    public endIndexes: number[],
    public childModuleName?: string,
  ) { }
  //#endregion

  //#region has symbol
  hasSymbol(symbolofConstFnClass: string) {
    const symbolsToFind = [
      `class ${symbolofConstFnClass}`,
      `const ${symbolofConstFnClass} =`,
      `let ${symbolofConstFnClass} =`,
      `var ${symbolofConstFnClass} =`,
      `function ${symbolofConstFnClass}(`,
    ];

    for (let j = 0; j < this.startIndexes.length; j++) {
      const startIndex = this.startIndexes[j];
      const endIndex = this.endIndexes[j];

      for (let indexLine = startIndex; indexLine <= endIndex; indexLine++) {
        const line = this.contentLines[indexLine];
        for (let indexSymbol = 0; indexSymbol < symbolsToFind.length; indexSymbol++) {
          const symbol = symbolsToFind[indexSymbol];
          if (line.startsWith(symbol)) {
            return true;
          }
        }
      }
    }


    return false;
  }
  //#endregion

  //#region clear lines
  clearLines() {
    for (let j = 0; j < this.startIndexes.length; j++) {
      const startIndex = this.startIndexes[j];
      const endIndex = this.endIndexes[j];
      for (let index = startIndex; index <= endIndex; index++) {
        this.contentLines[index] = `/* code-for-module=${this.childModuleName} */`
      }
    }
  }
  //#endregion
}
export class BundleMjsFesmModuleSpliter {

  //#region static
  public static fixForTarget(smartContainerChild: Project, mjsFileAbsPath: string) {
    return (new BundleMjsFesmModuleSpliter(smartContainerChild, mjsFileAbsPath)).process();
  }
  //#endregion

  //#region fields
  private readonly content: string;
  private readonly originalContent: string;
  private readonly contentLines: string[];
  private beginLineToOmit: number | null;
  private modules: MjsModule[] = [];
  //#endregion

  //#region target module
  private get targetModules(): MjsModule[] {
    let founded = this.modules.filter(m => m.childModuleName === this.smartContainerChild.name);
    if (!founded) {
      if (this.modules.length === 1) {
        const first = _.first(this.modules);
        first.childModuleName = this.smartContainerChild.name;
        return [first];
      }
      const line = this.contentLines[this.beginLineToOmit + 1];
      if (line
        && !line.startsWith(MjsModule.EXPORT_STRING_ALL)
        && !line.startsWith(MjsModule.EXPORT_STRING)
        && !line.startsWith(SourceMappingUrl.SOURCEMAPDES)
        && ((this.beginLineToOmit + 1) <= this.contentLines.length)
      ) {
        const dummyModule = new MjsModule(
          this.contentLines,
          [this.beginLineToOmit + 1],
          [this.contentLines.length - 1],
          this.smartContainerChild.name,
        );
        this.modules.push(dummyModule);
        return [dummyModule];
      }
      return void 0;
    }
    return founded;
  }
  //#endregion

  //#region constructor
  private constructor(
    private smartContainerChild: Project,
    private mjsFileAbsPath: string,
  ) {
    this.content = Helpers.readFile(mjsFileAbsPath) || '';
    this.originalContent = this.content;
    this.contentLines = this.content.split(/\r?\n/);
  }
  //#endregion

  //#region process

  private process(): string {
    if (!this.content) {
      return;
    }
    this.searchForBeginModulesImportIndexs()
    this.searchForModules();
    this.replaceExportForSpecyficTarget();
    this.cleanModuleExceptTarget();
    this.writeFile();
  }
  //#endregion

  //#region search for begin module index
  private isBeginLineToOmit(line: string) {
    return line.trim().startsWith('import {')
      || line.trim().startsWith('import *')
      || line.trim() === ''
      || !_.isUndefined(MjsModule.COMMENTS.find(c => line.trim().startsWith(c)))
      ;
  }
  private searchForBeginModulesImportIndexs() {
    const indexFirstLineToOmit = this.contentLines.findIndex(line => this.isBeginLineToOmit(line));
    if (indexFirstLineToOmit < 0) {
      this.beginLineToOmit = null;
      return;
    }
    let index = indexFirstLineToOmit;
    this.beginLineToOmit = indexFirstLineToOmit;
    while (index <= (this.contentLines.length - 1)) {
      index++;
      const line = this.contentLines[index];
      if (this.isBeginLineToOmit(line)) {
        this.beginLineToOmit = index;
      } else {
        return;
      }
    }
  }
  //#endregion

  //#region search for modules
  private searchForModules() {
    let index = (this.beginLineToOmit !== null) ? (this.beginLineToOmit + 1) : 0;
    const regexEndOfFile = /\@\-\-end\-of\-file\-for\-module\=[a-z0-9|\-|\.|\-]+/;

    while (index <= (this.contentLines.length - 1)) {
      const line = this.contentLines[index];
      if (line.trim().startsWith(MjsModule.EXPORT_STRING)
        || line.trim().startsWith(SourceMappingUrl.SOURCEMAPDES)
        || line.trim().startsWith(MjsModule.EXPORT_STRING_ALL)
      ) {
        return;
      }
      if (this.modules.length === 0) {
        this.modules.push(new MjsModule(this.contentLines, [index], [index]));
      }
      const lastModule = _.last(this.modules);

      if (line.trim().startsWith(`// ${MjsModule.KEY_END_MODULE_FILE}`)) {
        const mathes = line.match(regexEndOfFile);
        // if(!mathes) {
        //   debugger
        // }
        const [__, childName] = (_.first(mathes)).split('=');
        lastModule.childModuleName = childName;
        lastModule.endIndexes[lastModule.endIndexes.length - 1] = index;
        const nextLine = (this.contentLines[index + 1] || '').trim();
        if (!nextLine.startsWith(MjsModule.EXPORT_STRING)
          && !nextLine.startsWith(SourceMappingUrl.SOURCEMAPDES)
          && !nextLine.startsWith(MjsModule.EXPORT_STRING_ALL)
        ) {
          this.modules.push(new MjsModule(this.contentLines, [index + 1], [index + 1]));
        }
      } else {
        lastModule.endIndexes[lastModule.endIndexes.length - 1] = index;
      }
      index++;
    }
  }
  //#endregion

  //#region replace export for specyfic target
  private replaceExportForSpecyficTarget() {
    const exportLineIndex = this.contentLines.findIndex((line) => {
      return line.startsWith(MjsModule.EXPORT_STRING);
    });

    if (exportLineIndex !== -1) {
      const targetModules = this.targetModules;

      if (targetModules) {
        let exLine = this.contentLines[exportLineIndex];
        const symbols = exLine
          .replace(MjsModule.EXPORT_STRING, '')
          .replace(MjsModule.EXPORT_STRING_END, ' ')
          .split(',')
          .map(classOrConstOrFn => classOrConstOrFn.trim())
          .filter(f => {
            return !_.isUndefined(targetModules.find(m => m.hasSymbol(f)));
          });

        this.contentLines[exportLineIndex] = `${MjsModule.EXPORT_STRING} ${symbols.join(', ')} ${MjsModule.EXPORT_STRING_END}`;
      }
    }
  }
  //#endregion

  //#region clean module except target
  private cleanModuleExceptTarget() {
    const modulesExcepTarget = this.modules.filter(f => f.childModuleName !== this.smartContainerChild.name);
    for (let index = 0; index < modulesExcepTarget.length; index++) {
      const m = modulesExcepTarget[index];
      m.clearLines()
    }
  }
  //#endregion

  //#region write file
  private writeFile() {
    const fixedContent = this.contentLines.join('\n');
    // this.originalContent
    // console.log(`${this.originalContent}


    // fixed:

    // ${fixedContent}`);
    Helpers.writeFile(this.mjsFileAbsPath, fixedContent);
    // @LAST
  }
  //#endregion


}
