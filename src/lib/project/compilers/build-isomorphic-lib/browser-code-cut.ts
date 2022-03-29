//#region @backend
import {
  _,
  path,
  fse,
  crossPlatformPath,
} from 'tnp-core';

import { ConfigModels } from 'tnp-config';
import { Models } from 'tnp-models';
import { Helpers } from 'tnp-helpers';

const filesToDebug = [
  'app.ts'
]

export class CodeCut {

  browserCodeCut: { new(any?): BrowserCodeCut }
  constructor(
    protected cwd: string,
    protected filesPathes: string[],
    protected options: Models.dev.ReplaceOptionsExtended) {
    // console.log('init code cut ', this.options)
    this.browserCodeCut = BrowserCodeCut;
  }

  files() {
    // console.log('options in fiels', this.options)
    this.filesPathes.forEach((relativePathToFile) => {
      const absolutePathToFile = crossPlatformPath(path.join(this.cwd, relativePathToFile))
      // console.log('process', absolutePathToFile)
      this.file(absolutePathToFile);
    })
  }

  file(absolutePathToFile) {
    // console.log('options here ', options)
    // return new (this.browserCodeCut)(absolutePathToFile)
    //   // .FLATTypescriptImportExport('import')
    //   // .FLATTypescriptImportExport('export')
    //   .REPLACERegionsForIsomorphicLib(_.cloneDeep(this.options))
    //   .REPLACERegionsFromTsImportExport('import')
    //   .REPLACERegionsFromTsImportExport('export')
    //   .REPLACERegionsFromJSrequire()
    //   .saveOrDelete()
  }
}


export class BrowserCodeCut {

  public static IsomorphicLibs = [];
  public static resolveAndAddIsomorphicLibs(libsNames: string[]) {
    this.IsomorphicLibs = this.IsomorphicLibs.concat(libsNames);
  }


  protected browserString = 'browser';

  protected isDebuggingFile = false;

  protected rawContent: string;

  get isEmpty() {
    return this.rawContent.replace(/\s/g, '').trim() === '';
  }

  constructor(protected absoluteFilePath: string) {
    this.rawContent = fse.existsSync(absoluteFilePath) ?
      fse.readFileSync(absoluteFilePath, 'utf8').toString()
      : '';
  }


  debug(fileName: string) {
    // console.log('path.basename(this.absoluteFilePath)',path.basename(this.absoluteFilePath))
    this.isDebuggingFile = (path.basename(this.absoluteFilePath) === fileName);
  }

  public FLATTypescriptImportExport(usage: ConfigModels.TsUsage) {
    if (!this.absoluteFilePath.endsWith('.ts')) {
      return this;
    }
    const isExport = (usage === 'export');
    const fileContent: string = this.rawContent;
    const commentStart = new RegExp(`\\/\\*`);
    const commentEnds = new RegExp(`\\*\\/`);
    const commentEndExportOnly = new RegExp(`^(\\ )*\\}\\;?\\ *`);
    const singleLineExport = new RegExp(`^\\ *export\\ +\\{.*\\}\\;?`)

    const regextStart = new RegExp(`${usage}\\s+{`)
    const regexEnd = new RegExp(`from\\s+(\\'|\\").+(\\'|\\")`)
    let toAppendLines = 0;
    let insideComment = false;
    if (_.isString(fileContent)) {
      let appendingToNewFlatOutput = false;
      let newFlatOutput = '';
      fileContent.split(/\r?\n/).forEach((line, index) => {

        const matchSingleLineExport = isExport && singleLineExport.test(line);
        const matchCommentStart = commentStart.test(line);
        const matchCommentEnd = commentEnds.test(line);
        const matchStart = regextStart.test(line);

        const matchEndExportOnly = isExport && commentEndExportOnly.test(line) && (line.replace(commentEndExportOnly, '') === '');
        const matchEnd = (matchEndExportOnly || regexEnd.test(line))


        if (matchCommentStart) {
          insideComment = true;
        }
        if (insideComment && matchCommentEnd) {
          insideComment = false;
        }
        // (path.basename(this.absoluteFilePath) === 'core-imports.ts') && console.log(`${insideComment}: ${line}`)
        // isExport && (path.basename(this.absoluteFilePath) === 'core-imports.ts') && console.log(`export end: ${matchEndExportOnly}: >>>${line}<<<`)
        // console.log(`I(${regexParialUsage.test(line)}) F(${regexFrom.test(line)})\t: ${line} `)
        // (path.basename(this.absoluteFilePath) === 'core-imports.ts') && console.log(`matchSingleLineExport: ${matchSingleLineExport}: >>>${line}<<<`)
        // if (insideComment || matchSingleLineExport) {
        //   newFlatOutput += (((index > 0) ? '\n' : '') + line);
        //   toAppendLines++;
        // }
        if (appendingToNewFlatOutput) {
          if (!matchStart && !matchEnd) {
            newFlatOutput += ` ${line}`;
            toAppendLines++;
          } else if (insideComment) {
            newFlatOutput += ` ${line}`;
            toAppendLines++;
          } else if (matchEnd) {
            appendingToNewFlatOutput = false;
            newFlatOutput += ` ${line}${_.times(toAppendLines,
              () => `${Models.label.flatenImportExportRequred}\n`).join('')}`;
            toAppendLines = 0;
          }
        } else {
          if (insideComment) {
            newFlatOutput += (((index > 0) ? '\n' : '') + line);
          } else {
            if (matchSingleLineExport) {
              newFlatOutput += (((index > 0) ? '\n' : '') + line);
            } else {
              appendingToNewFlatOutput = (matchStart && !matchEnd);
              // if (joiningLine) console.log('line', line)
              newFlatOutput += (((index > 0) ? '\n' : '') + line);
            }
            toAppendLines = 1;
          }
        }

      })
      this.rawContent = newFlatOutput;
    }
    // console.log('\n\n\n\n')
    return this;
  }

  /**
   * Get "npm package name" from line of code in .ts or .js files
   */
  private get resolvePackageNameFrom() {
    const self = this;
    return {
      JSrequired(rawImport) {
        rawImport = rawImport.replace(new RegExp(`require\\((\\'|\\")`), '')
        rawImport = rawImport.replace(new RegExp(`(\\'|\\")\\)`), '')
        rawImport = rawImport.trim()
        if (rawImport.startsWith(`./`)) return void 0;
        if (rawImport.startsWith(`../`)) return void 0;
        const fisrtName = rawImport.match(new RegExp(`\@?([a-zA-z]|\-)+\\/`))
        let res: string = (_.isArray(fisrtName) && fisrtName.length > 0) ? fisrtName[0] : rawImport;
        if (res.endsWith('/') && res.length > 1) {
          res = res.substring(0, res.length - 1)
        }
        return res;
      },

      TSimportExport(rawImport, usage: ConfigModels.TsUsage) {
        // const orgImport = rawImport;
        rawImport = rawImport.replace(new RegExp(`${usage}.+from\\s+`), '')
        rawImport = rawImport.replace(new RegExp(`(\'|\")`, 'g'), '').trim()
        if (rawImport.startsWith(`./`)) return void 0;
        if (rawImport.startsWith(`../`)) return void 0;

        const workspacePackgeMatch = (rawImport.match(new RegExp(`^\\@([a-zA-z]|\\-)+\\/([a-zA-z]|\\-)+$`)) || [])
          .filter(d => d.length > 1);
        const worskpacePackageName = (_.isArray(workspacePackgeMatch) && workspacePackgeMatch.length === 1)
          ? _.first(workspacePackgeMatch) : void 0;

        // const normalPackageMatch = (rawImport.match(new RegExp(`^([a-zA-z]|\\-)+\\/`)) || []);
        // const normalPackageName = (_.isArray(normalPackageMatch) && normalPackageMatch.length === 1)
        //   ? _.first(normalPackageMatch) : '';

        let res: string = worskpacePackageName ? worskpacePackageName : rawImport;
        if (res.endsWith('/') && res.length > 1) {
          res = res.substring(0, res.length - 1)
        }
        return res;
      }
    };
  }

  /**
   * LOOG HERE
    * ./src/lib/project/compilers/build-isomorphic-lib/browser-code-cut-extended.backend.ts
    */
  protected getInlinePackage(packageName: string, packagesNames = BrowserCodeCut.IsomorphicLibs): Models.InlinePkg {

    // console.log('MORPHI this.isomorphicLibs', this.isomorphicLibs)
    let realName = packageName;
    let isIsomorphic = false;
    if (packageName !== void 0) {
      isIsomorphic = !!packagesNames
        .find(p => {
          if (p === packageName) {
            return true;
          }
          const slashes = (p.match(new RegExp("\/", "g")) || []).length;
          if (slashes === 0) {
            return p === packageName
          }
          // console.log('am here ', packageName)
          // console.log('p', p)
          if (p.startsWith(packageName)) {
            realName = p;
            // console.log('FOUDNED for ', packageName)
            // console.log('is REAL', p)
            return true;
          }
          return false;
        });
    }
    return {
      isIsomorphic,
      realName
    }
  }

  protected REGEX_REGION(word) {
    return new RegExp("[\\t ]*\\/\\/\\s*#?region\\s+" + word + " ?[\\s\\S]*?\\/\\/\\s*#?endregion ?[\\t ]*\\n?", "g")
  }

  protected replaceRegionsWith(stringContent = '', words = []) {
    if (words.length === 0) return stringContent;
    let word = words.shift();
    let replacement = ''
    if (Array.isArray(word) && word.length === 2) {
      replacement = word[1];
      word = word[0]
    }


    stringContent = stringContent.replace(this.REGEX_REGION(word), replacement);
    return this.replaceRegionsWith(stringContent, words);
  }

  protected replaceFromLine(pkgName: string, imp: string) {
    const p = this.getInlinePackage(pkgName)
    if (p.isIsomorphic) {
      const replacedImp = imp.replace(p.realName, `${p.realName}/${this.browserString}`);
      this.rawContent = this.rawContent.replace(imp, replacedImp);
    }
  }

  REPLACERegionsFromTsImportExport(usage: ConfigModels.TsUsage) {
    // const debug = filesToDebug.includes(path.basename(this.absoluteFilePath));
    // if (debug) {
    //   debugger
    // }
    if (!this.absoluteFilePath.endsWith('.ts')) {
      return this;
    }
    if (!_.isString(this.rawContent)) return;
    const importRegex = new RegExp(`${usage}.+from\\s+(\\'|\\").+(\\'|\\")`, 'g')
    let imports = this.rawContent.match(importRegex)
    // debug && console.log(imports)
    if (_.isArray(imports)) {
      imports.forEach(imp => {
        // debug && console.log('imp: ' + imp)
        const pkgName = this.resolvePackageNameFrom.TSimportExport(imp, usage);
        // debug && console.log('pkgName: ' + pkgName)
        if (pkgName) {
          this.replaceFromLine(pkgName, imp);
        }
      })
    }
    return this;
  }

  REPLACERegionsFromJSrequire() {
    if (!this.absoluteFilePath.endsWith('.ts')) {
      return this;
    }
    if (!_.isString(this.rawContent)) return;
    // fileContent = IsomorphicRegions.flattenRequiresForContent(fileContent, usage)
    const importRegex = new RegExp(`require\\((\\'|\\").+(\\'|\\")\\)`, 'g')
    let imports = this.rawContent.match(importRegex)
    // console.log(imports)
    if (_.isArray(imports)) {
      imports.forEach(imp => {
        const pkgName = this.resolvePackageNameFrom.JSrequired(imp);
        if (pkgName) {
          this.replaceFromLine(pkgName, imp);
        }
      })
    }
    return this;
  }

  REPLACERegionsForIsomorphicLib(options: Models.dev.ReplaceOptionsExtended) {

    // console.log('options.replacements', options.replacements)
    if (this.absoluteFilePath.endsWith('.ts')) {
      this.rawContent = this.replaceRegionsWith(this.rawContent, options.replacements)
    }
    this.rawContent = this.afterRegionsReplacement(this.rawContent)
    return this;
  }

  protected afterRegionsReplacement(content: string) {
    return content;
  }

  saveOrDelete() {
    // console.log('saving ismoprhic file', this.absoluteFilePath)
    if (this.isEmpty && ['.ts', '.js'].includes(path.extname(this.absoluteFilePath))) {
      if (fse.existsSync(this.absoluteFilePath)) {
        fse.unlinkSync(this.absoluteFilePath)
      }
      // console.log(`Delete empty: ${deletePath}`)
    } else {
      // console.log(`Not empty: ${this.absoluteFilePath}`)
      if (!fse.existsSync(path.dirname(this.absoluteFilePath))) {
        fse.mkdirpSync(path.dirname(this.absoluteFilePath));
      }
      fse.writeFileSync(this.absoluteFilePath, this.rawContent, 'utf8');
    }
    // }
  }


}


//#endregion
