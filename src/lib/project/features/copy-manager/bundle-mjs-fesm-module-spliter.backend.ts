import { config } from 'tnp-config/src';
import { _ } from 'tnp-core/src';
import { Helpers } from "tnp-helpers/src";
import { Models } from 'tnp-models/src';
import { Project } from "../../abstract";
import { SourceMappingUrl } from './source-maping-url.backend';

const debugMode = true;

export class MjsModule {
  //#region static
  static readonly KEY_END_MODULE_FILE = ';({}); // @--end-of-file-for-module=';
  static readonly EXPORT_STRING = 'export {';
  static readonly COMMENTS = ['*/', '/*', '*']
  static readonly EXPORT_STRING_END = ' };';
  static readonly EXPORT_STRING_ALL = 'export *';
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
      `class ${symbolofConstFnClass} `,
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
        if (debugMode) {
          this.contentLines[index] = `/* code-for-module=${this.childModuleName} */`
        } else {
          this.contentLines[index] = '';
        }
      }
    }
  }
  //#endregion
}
export class BundleMjsFesmModuleSpliter {

  //#region static
  public static fixForTarget(smartContainerChild: Project, mjsFileAbsPath: string, buildDirBrowser: Models.dev.BuildDirBrowser) {
    return (new BundleMjsFesmModuleSpliter(smartContainerChild, mjsFileAbsPath, buildDirBrowser)).process();
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
    private buildDirBrowser: Models.dev.BuildDirBrowser
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
    this.preventNotExportingAll();
    this.replaceExportForSpecyficTarget();
    this.cleanModuleExceptTarget();
    this.preventNotUsingImports();
    this.fixBigExport();
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
    // const stringForRegex = `${Helpers.escapeStringForRegEx(MjsModule.KEY_END_MODULE_FILE)}[a-z0-9|\\-|\\.|\\-]+`; // TODO
    // console.log({
    //   stringForRegex
    // })
    // const regexEndOfFile = new RegExp(stringForRegex);
    // const regexEndOfFile = /\;\(\{\}\)\;\ \/\/ \@\-\-end\-of\-file\-for\-module\=[a-z0-9|\-|\.|\-]+/;
    // const regexEndOfFile = /\(\{\}\)\;\ \/\/\ @--end-of-file-for-module=/
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

      if (line.trimLeft().startsWith(MjsModule.KEY_END_MODULE_FILE.slice(1))) {
        const mathes = line.match(regexEndOfFile);
        // if(!mathes) {
        //   debugger
        // }
        // console.log('founded')
        // console.log({
        //   mathes
        // })
        let [__, childName] = (_.first(mathes)).split('=');
        childName = _.first(childName.split(' '));

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


  private candidates: { className: string; className1: string; }[] = [];
  private megaImportLine?: string;

  /**
    * TODO SUPER DIRTY QUICK_FIX
    */
  preventNotExportingAll() {
    // const importsFor: {
    //   childName:string,
    //   parentName: string,
    //   imports: string[];
    // }[] = [];


    const exportLineIndex = this.contentLines.findIndex((line) => {
      return line.startsWith(MjsModule.EXPORT_STRING);
    });

    if (exportLineIndex !== -1) {
      let exLine = this.contentLines[exportLineIndex];
      // let indexForModuleImport = (this.beginLineToOmit !== null) ? (this.beginLineToOmit + 1) : 0;

      const modulesExcepTarget = this.modules.filter(f => f.childModuleName !== this.smartContainerChild.name);
      const allSymbols = exLine
        .replace(MjsModule.EXPORT_STRING, '')
        .replace(MjsModule.EXPORT_STRING_END, ' ')
        .split(',')
        .map(classOrConstOrFn => classOrConstOrFn.trim());

      const parent = this.smartContainerChild.parent;
      const childsExceptTarget = parent.children.filter(f => f.name !== this.smartContainerChild.name);
      const megaImportLine = childsExceptTarget.map(c => {
        const modulesForChild = modulesExcepTarget.filter(f => f.childModuleName === c.name);
        const symbolsForChild = allSymbols
          .filter(f => {
            return !_.isUndefined(modulesForChild.find(m => m.hasSymbol(f)));
          })
          .map(s => {
            this.candidates.push({
              className: s,
              className1: `${s}$1`
            });
            return `${s} as ${s}$1`
          });

        if (symbolsForChild.length === 0) {
          return void 0;
        }
        return `import { ${symbolsForChild.join(', ')} } from '@${parent.name}/${c.name}/${this.buildDirBrowser}'`;
      }).filter(f => !!f).join(';')

      this.megaImportLine = megaImportLine;

      // console.log({
      //   megaImportLine
      // })
    }

  }

  //#region clean module except target
  private cleanModuleExceptTarget() {
    const modulesExcepTarget = this.modules.filter(f => f.childModuleName !== this.smartContainerChild.name);
    for (let index = 0; index < modulesExcepTarget.length; index++) {
      const m = modulesExcepTarget[index];
      m.clearLines()
    }
  }
  //#endregion


  preventNotUsingImports() {
    // DIRTY FIX
    // const regex = /[A-Z]([a-zA-Z0-9])+\ as\ [A-Z][a-zA-Z0-9]+\$[0-9]/g;
    // const candidates: { className: string; className1: string; }[] = [];
    // for (let index = 0; index < this.contentLines.length; index++) {
    //   const line = this.contentLines[index];
    //   if (line.startsWith('import {')) {
    //     const m = (line.match(regex) || []);
    //     for (let index2 = 0; index2 < m.length; index2++) {
    //       const [className, className1] = m[index2].split(' as ');
    //       candidates.push({
    //         className, className1
    //       });
    //     }
    //   }
    // }



  }

  /**
   * QUICK_FIX
   */
  fixBigExport() {
    for (let index = 0; index < this.contentLines.length; index++) {
      const line = this.contentLines[index];
      if (line.startsWith('import {') && line.search(`from '@${this.smartContainerChild.parent.name}/`) !== -1) {
        this.contentLines[index] = '';
      }
    }
    let indexForModuleImport = (this.beginLineToOmit !== null) ? (this.beginLineToOmit) : 0;
    this.contentLines[indexForModuleImport] = this.megaImportLine;

    const candidates = this.candidates;
    for (let index = 0; index < this.contentLines.length; index++) {
      const line = this.contentLines[index];
      if (
        !line.startsWith('import {')
        && !line.startsWith('import *')
        && !line.startsWith(MjsModule.EXPORT_STRING)
        && !line.startsWith(MjsModule.EXPORT_STRING_ALL)
      ) {
        for (let index2 = 0; index2 < candidates.length; index2++) {
          const { className, className1 } = candidates[index2];
          if (line.search(`: ${className},`) !== -1) {
            this.contentLines[index] = line.replace(
              new RegExp(Helpers.escapeStringForRegEx(`: ${className},`), 'g'),
              `: ${className1},`
            );
          }
        }
      }
    }
  }

  //#region write file
  private writeFile() {
    const fixedContent = (debugMode ? this.contentLines
      : this.contentLines.filter(f => f.trim() !== '')).join('\n');
    // this.originalContent
    // console.log(`${this.originalContent}


    // fixed:

    // ${fixedContent}`);
    Helpers.writeFile(this.mjsFileAbsPath, fixedContent);
  }
  //#endregion


}
