import { extAllowedToExportAndReplaceTSJSCodeFiles } from 'tnp-config/src';
import { Helpers } from 'tnp-helpers/src';
import { path, _ } from 'tnp-core/src';
import { TsImportExport, recognizeImportsFromFile } from 'tnp-helpers/src';
import { CODE_SPLIT_PROCESS } from './code-split-process.enum';
import type { CallBackProcess } from './code-split-process.enum';
import { taonIgnore } from '../../../../constants';

export class SplitFileProcess {
  private importExports: TsImportExport[] = [];
  private rewriteFile: boolean = false;
  constructor(
    private fileContent: string,
    private filePath: string,
    private isomorphicLibraries: string[],
  ) {
    this.importExports = recognizeImportsFromFile(fileContent);
    this.processImportsExports();
  }

  //#region get content
  get content(): { modifiedContent: string; rewriteFile: boolean } {
    //#region @backendFunc
    if (
      _.isUndefined(
        extAllowedToExportAndReplaceTSJSCodeFiles.find(a =>
          this.filePath.endsWith(a),
        ),
      )
    ) {
      // console.error(`Not allowed to export and replace file: ${this.filePath}`);
      return { modifiedContent: this.fileContent, rewriteFile: false };
    }

    // console.log(this.isomorphicLibraries);
    // process.exit(0);
    //     console.log(`
    //     file: ${path.basename(this.filePath)}
    // ${this.importExports
    //   .map(i => {
    //     return `${i.embeddedPathToFile} (${i.type})`;
    //   })
    //   .join('\n')}
    //     `);
    const BEFORE_PROCESSES = Object.values(
      CODE_SPLIT_PROCESS.BEFORE.SPLIT.IMPORT_EXPORT,
    );
    for (const imp of this.importExports) {
      if (!imp.isIsomorphic) {
        continue;
      }
      for (const processFun of BEFORE_PROCESSES) {
        if (_.isFunction(processFun)) {
          const rewrite = (processFun as ReturnType<typeof CallBackProcess>)(
            imp,
            this.isomorphicLibraries,
          );
          if (!this.rewriteFile && rewrite) {
            this.rewriteFile = true;
            continue;
          }
        }
      }
    }

    const result = this.replaceInFile(this.fileContent, this.importExports);
    return { modifiedContent: result, rewriteFile: this.rewriteFile };
    //#endregion
  }
  //#endregion

  private processImportsExports(): void {
    for (const imp of this.importExports) {
      imp.packageName = imp.cleanEmbeddedPathToFile.startsWith('@')
        ? imp.cleanEmbeddedPathToFile.split('/').slice(0, 2).join('/')
        : imp.cleanEmbeddedPathToFile.split('/')[0];

      imp.isIsomorphic = !_.isUndefined(
        this.isomorphicLibraries.find(l => l === imp.packageName),
      );
      if (!imp.isIsomorphic) {
        continue;
      }
    }
  }

  private replaceInFile(
    fileContent: string,
    imports: TsImportExport[],
  ): string {
    // Split the content into lines
    const lines = fileContent.split('\n');

    // Sort the imports by descending order of startRow and startCol
    // This ensures that changes do not affect the indices of upcoming replacements
    imports.sort((a, b) => {
      if (a.startRow === b.startRow) {
        return b.startCol - a.startCol; // Sort by column when in the same row
      }
      return b.startRow - a.startRow; // Otherwise, sort by row
    });

    // Perform replacements from last to first
    for (const imp of imports) {
      const lineIndex = imp.startRow - 1;

      if (lineIndex < lines.length) {
        const line = lines[lineIndex];
        const prevLine = lines[lineIndex - 1];
        if (prevLine && prevLine.includes(taonIgnore)) {
          continue;
        }
        const actualStartIndex = imp.startCol - 1;
        const actualEndIndex = imp.endCol - 1;

        if (
          actualStartIndex <= actualEndIndex &&
          actualStartIndex < line.length &&
          actualEndIndex <= line.length
        ) {
          // const before = line.substring(0, actualStartIndex);
          // const after = line.substring(actualEndIndex + 1);
          lines[lineIndex] = lines[lineIndex].replace(
            imp.embeddedPathToFile,
            imp.embeddedPathToFileResult,
          );
        }
      }
    }
    // Join the modified lines back into a single string
    return lines.join('\n');
  }
}
