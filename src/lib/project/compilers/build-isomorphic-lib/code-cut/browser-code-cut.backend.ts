//#region imports
import {
  _,
  path,
  fse,
} from 'tnp-core';

import { config, ConfigModels } from 'tnp-config';
import { Models } from 'tnp-models';
import { Helpers } from 'tnp-helpers';
import type { Project } from '../../../abstract/project/project';
import { BuildOptions } from 'tnp-db';
import { RegionRemover } from 'isomorphic-region-loader';
//#endregion

//#region consts
const filesToDebug = [
  // 'app.ts'
]

const regexAsyncImport = /\ import\((\`|\'|\")([a-zA-Z|\-|\@|\/|\.]+)(\`|\'|\")\)/;
const regexAsyncImportG = /\ import\((\`|\'|\")([a-zA-Z|\-|\@|\/|\.]+)(\`|\'|\")\)/g;
//#endregion

export class BrowserCodeCut {

  //#region static
  public static IsomorphicLibs = [];
  public static resolveAndAddIsomorphicLibs(libsNames: string[]) {
    this.IsomorphicLibs = this.IsomorphicLibs.concat(libsNames);
  }
  //#endregion

  //#region fields & getters
  private options: Models.dev.ReplaceOptionsExtended;
  protected browserString = 'browser';

  protected isDebuggingFile = false;

  protected rawContent: string;
  public rawContentBackend: string;
  readonly allowedToReplace = Models.other.CutableFileExtArr;


  readonly allowedToReplaceDotPref = Models.other.CutableFileExtArr
    .concat(['js'])
    .map(ext => `.${ext}`);

  get isEmptyBrowserFile() {
    return this.rawContent.replace(/\s/g, '').trim() === '';
  }

  get isEmptyBackendFile() {
    return !this.rawContentBackend || (this.rawContentBackend.replace(/\s/g, '').trim() === '');
  }

  get isEmptyModuleBackendFile() {
    return (this.rawContentBackend || '').replace(/\/\*\ \*\//g, '').trim().length === 0;
  }
  //#endregion

  //#region constructor
  // constructor(
  //   protected absoluteFilePath: string
  // ) {
  //   this.rawContent = fse.existsSync(absoluteFilePath) ?
  //     fse.readFileSync(absoluteFilePath, 'utf8').toString()
  //     : '';
  // }
  // //#endregion
  constructor(
    protected absoluteFilePath: string,
    private project?: Project,
    private compilationProject?: Project,
    private buildOptions?: BuildOptions,
    private sourceOutBrowser?: string,
  ) {
    this.rawContent = fse.existsSync(absoluteFilePath) ?
      fse.readFileSync(absoluteFilePath, 'utf8').toString()
      : '';
  }
  //#endregion

  //#region methods
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
      TSimportExport(rawImport: string, usage: ConfigModels.TsUsage) {
        // const orgImport = rawImport;
        if (usage === 'import') {
          const matches = rawImport.match(regexAsyncImport);
          if (Array.isArray(matches) && matches.length > 0) {
            const first = _.first(matches);
            rawImport = first;
            rawImport = rawImport.replace(/\ import\((\`|\'|\")/, '');
            rawImport = rawImport.replace(/(\`|\'|\")\)/, '');
          }
        }

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

  protected getInlinePackage(packageName: string, packagesNames = BrowserCodeCut.IsomorphicLibs): Models.InlinePkg {

    let parent: Project;
    if (this.project.isSmartContainer) {
      parent = this.project;
    }
    if (this.project.isSmartContainerChild) {
      parent = this.project.parent;
    }
    if (this.project.isSmartContainerTarget) {
      parent = this.project.smartContainerTargetParentContainer;
    }

    const additionalSmartPckages = (!parent ? [] : parent.children.map(c => `@${parent.name}/${c.name}`));

    const packages = packagesNames.concat([
      ...(parent ? [] : [this.project.name]),
      ...additionalSmartPckages,
    ]);


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

  // protected replaceFromLine(pkgName: string, imp: string) {
  //   const p = this.getInlinePackage(pkgName)
  //   if (p.isIsomorphic) {
  //     const replacedImp = imp.replace(p.realName, `${p.realName}/${this.browserString}`);
  //     this.rawContent = this.rawContent.replace(imp, replacedImp);
  //   }
  // }
  replaceFromLine(pkgName: string, imp: string) {
    // console.log(`Check package: "${pkgName}"`)
    // console.log(`imp: "${imp}"`)
    const inlinePkg = this.getInlinePackage(pkgName)

    if (inlinePkg.isIsomorphic) {
      // console.log('inlinePkg ', inlinePkg.realName)
      const replacedImp = imp.replace(inlinePkg.realName, `${inlinePkg.realName}/${this.browserString}`);
      this.rawContent = this.rawContent.replace(imp, replacedImp);
      return;
    }
    if (this.compilationProject.isWorkspaceChildProject && this.absoluteFilePath) {
      // console.log(`check child: ${pkgName}`)
      const parent = (this.compilationProject.isGenerated && !this.compilationProject.isWorkspaceChildProject
      ) ? this.compilationProject.grandpa : this.compilationProject.parent;
      const child = parent.child(pkgName, false);
      if (child && this.buildOptions && !this.buildOptions.appBuild) {
        // console.log(`child founded: ${pkgName}`)
        const orgImp = imp;
        let proceed = true;
        if (child.typeIs('isomorphic-lib')) {
          const sourceRegex = `${pkgName}\/(${config.moduleNameIsomorphicLib.join('|')})(?!\-)`;
          const regex = new RegExp(sourceRegex);
          // console.log(`[isomorphic-lib] Regex source: "${sourceRegex}"`)
          if (regex.test(imp)) {
            // console.log(`[isom] MATCH: ${imp}`)
            imp = imp.replace(regex, pkgName);
          } else {

            const regexAlreadyIs = new RegExp(`${pkgName}\/${Helpers.getBrowserVerPath(this.project && this.project.name)}`);
            if (regexAlreadyIs.test(imp)) {
              imp = imp.replace(regexAlreadyIs, pkgName);
            } else {
              proceed = false;
            }

            // console.log(`[isom] NOTMATCH: ${imp}`)
          }
          // console.log(`[isomorphic-lib] Regex replaced: "${imp}"`)
        } else {
          const sourceRegex = `${pkgName}\/(${config.moduleNameAngularLib.join('|')})(?!\-)`;
          const regex = new RegExp(sourceRegex);
          // console.log(`[angular-lib] Regex source: "${sourceRegex}"`)
          if (regex.test(imp)) {
            // console.log(`[angul] MATCH: ${imp}`)
            imp = imp.replace(regex, pkgName);
          } else {

            const regexAlreadyIs = new RegExp(`${pkgName}\/${Helpers.getBrowserVerPath(this.project && this.project.name)}`);
            if (regexAlreadyIs.test(imp)) {
              imp = imp.replace(regexAlreadyIs, pkgName);
            } else {
              proceed = false;
            }

            // console.log(`[angul] NOTMATCH: ${imp}`)
          }
          // console.log(`[angular-lib] Regex replaced: "${imp}"`)
        }
        if (proceed) {

        }
        const replacedImp = imp.replace(pkgName,
          `${pkgName}/${Helpers.getBrowserVerPath(this.project && this.project.name)}`);
        this.rawContent = this.rawContent.replace(orgImp, replacedImp);
        return;

      }
    }

  }



  REPLACERegionsFromTsImportExport(usage: ConfigModels.TsUsage) {
    // const debug = filesToDebug.includes(path.basename(this.absoluteFilePath));
    // if (debug) {
    //   debugger
    // }
    if (!this.absoluteFilePath.endsWith('.ts')
      // && !this.absoluteFilePath.endsWith('.tsx')
    ) {
      return this;
    }
    if (!_.isString(this.rawContent)) return;
    const importRegex = new RegExp(`${usage}.+from\\s+(\\'|\\").+(\\'|\\")`, 'g');

    const asynMatches = (usage === 'import') ? this.rawContent.match(regexAsyncImportG) : [];
    const normalMatches = this.rawContent.match(importRegex);

    const asyncImports = (Array.isArray(asynMatches) ? asynMatches : []);
    let imports = [
      ...(Array.isArray(normalMatches) ? normalMatches : []),
      ...asyncImports,
    ]
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
    if (!this.absoluteFilePath.endsWith('.ts')
      // && !this.absoluteFilePath.endsWith('.tsx')
    ) {
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

  // REPLACERegionsForIsomorphicLib(options: Models.dev.ReplaceOptionsExtended) {

  //   // console.log('options.replacements', options.replacements)
  //   if (this.absoluteFilePath.endsWith('.ts')) {
  //     this.rawContent = this.replaceRegionsWith(this.rawContent, options.replacements)
  //   }
  //   this.rawContent = this.afterRegionsReplacement(this.rawContent)
  //   return this;
  // }

  REPLACERegionsForIsomorphicLib(options: Models.dev.ReplaceOptionsExtended) {
    options = _.clone(options);
    this.options = options;
    // Helpers.log(`[REPLACERegionsForIsomorphicLib] options.replacements ${this.absoluteFilePath}`)
    const ext = path.extname(this.absoluteFilePath).replace('.', '') as ConfigModels.CutableFileExt;
    // console.log(`Ext: "${ext}" for file: ${path.basename(this.absoluteFilePath)}`)
    if (this.allowedToReplace.includes(ext)) {
      this.rawContent = this.project.sourceModifier.replaceBaslieneFromSiteBeforeBrowserCodeCut(this.rawContent);

      const orgContent = this.rawContent;
      this.rawContent = RegionRemover.from(this.absoluteFilePath, orgContent, options.replacements, this.project).output;
      if (this.project.isStandaloneProject || this.project.isSmartContainer) {
        this.rawContentBackend = RegionRemover.from(this.absoluteFilePath, orgContent, ['@bro' + 'wser'], this.project).output;
      }
    }
    if (this.project.frameworkVersionAtLeast('v3')) {
      // console.log(`isTarget fixing ? ${this.project.isSmartContainerTarget}`)
      // no modification of any code straight ng is being use
      if (this.project.isSmartContainerTarget) {
        const parent = this.project.smartContainerTargetParentContainer;
        parent.children
          .filter(f => f.typeIs('isomorphic-lib'))
          .forEach(c => {
            const from = `${c.name}/src/assets/`;
            const to = `/assets/assets-for/${c.name}/`;
            this.rawContent = this.rawContent.replace(new RegExp(Helpers.escapeStringForRegEx(`/${from}`), 'g'), to);
            this.rawContent = this.rawContent.replace(new RegExp(Helpers.escapeStringForRegEx(from), 'g'), to);
          });
      }
    } else {
      this.rawContent = this.afterRegionsReplacement(this.rawContent);
    }
    return this;
  }

  protected afterRegionsReplacement(content: string) {
    return content;
  }

  handleTickInCode(replacement: string): string {
    if (replacement.search('`') !== -1) {
      Helpers.warn(`[browsercodecut] Please dont use tick \` ... in ${path.basename(this.absoluteFilePath)}`)
      replacement = replacement.replace(/\`/g, '\\`');
    }
    return replacement;
  }

  handleOutput(replacement: string, ext: ConfigModels.CutableFileExt): string {
    replacement = this.handleTickInCode(replacement);

    return replacement;
  }

  saveOrDelete() {
    const modifiedFiles: Models.other.ModifiedFiles = { modifiedFiles: [] };
    const relativePath = this.absoluteFilePath
      .replace(`${this.compilationProject.location}/`, '')
      .replace(/^\//, '')

    // Helpers.log(`saving ismoprhic file: ${this.absoluteFilePath}`, 1)
    if (this.isEmptyBrowserFile && this.allowedToReplaceDotPref
      .filter(f => ![
        '.html', // fix for angular
        '.scss',
        '.css',
        '.sass',
        '.less',
        '.json',
      ].includes(f))
      .includes(path.extname(this.absoluteFilePath))
    ) {
      if (fse.existsSync(this.absoluteFilePath)) {
        fse.unlinkSync(this.absoluteFilePath)
      }
      // Helpers.log(`Delete empty: ${this.absoluteFilePath}`, 1);
    } else {
      // Helpers.log(`Not empty: ${this.absoluteFilePath}`, 1)
      if (!fse.existsSync(path.dirname(this.absoluteFilePath))) {
        fse.mkdirpSync(path.dirname(this.absoluteFilePath));
      }
      fse.writeFileSync(this.absoluteFilePath, this.rawContent, 'utf8');


      // if (path.isAbsolute(relativePath)) {
      //   console.log(`is ABsolute !`, relativePath)
      //   // process.exit(0)
      // }

      // Helpers.log(`Written file: ${relativePath}`, 1)
      this.compilationProject.sourceModifier.processFile(relativePath, modifiedFiles, 'tmp-src-for')
    }

    const isEmptyModuleBackendFile = this.isEmptyModuleBackendFile
    if ((!this.isEmptyBackendFile || isEmptyModuleBackendFile) && this.allowedToReplaceDotPref
      .includes(path.extname(this.absoluteFilePath))
    ) {
      const absoluteBackendFilePath = path.join(
        this.compilationProject.location,
        relativePath.replace('tmp-src', 'tmp-source')
      );

      if (!fse.existsSync(path.dirname(absoluteBackendFilePath))) {
        fse.mkdirpSync(path.dirname(absoluteBackendFilePath));
      }

      if (
        !relativePath.replace(/^\\/, '').startsWith(`tmp-src-dist/tests/`) &&
        !relativePath.replace(/^\\/, '').startsWith(`tmp-src-bundle/tests/`)
      ) {
        // console.log(relativePath)
        fse.writeFileSync(absoluteBackendFilePath,
          isEmptyModuleBackendFile ? `export function dummy${(new Date()).getTime()}() { }`
            : this.rawContentBackend,
          'utf8');
      }
    }
    // }
  }




  //#endregion

}
