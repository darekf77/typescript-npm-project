//#region imports
import {
  _,
  path,
  fse,
  crossPlatformPath,
} from 'tnp-core';

import { config, ConfigModels } from 'tnp-config';
import { Models } from 'tnp-models';
import { Helpers } from 'tnp-helpers';
import type { Project } from '../../../abstract/project/project';
import { BuildOptions } from 'tnp-db';
import { RegionRemover } from 'isomorphic-region-loader';
import { MjsModule } from '../../../features/copy-manager/bundle-mjs-fesm-module-spliter.backend';
//#endregion

//#region consts
const filesToDebug = [

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

  protected isDebuggingFile = false;

  protected rawContentForBrowser: string;
  public rawContentBackend: string;
  public static readonly extForStyles = [
    'scss',
    'css',
    'less',
    'sass',
  ].map(ext => `.${ext}`);
  public static readonly extAllowedToReplace = [
    ...BrowserCodeCut.extForStyles,
    ...[
      'html',
      'ts',
    ].map(ext => `.${ext}`),
  ];

  get isEmptyBrowserFile() {
    return this.rawContentForBrowser.replace(/\s/g, '').trim() === '';
  }

  // get isEmptyBackendFile() {
  //   return !this.rawContentBackend || (this.rawContentBackend.replace(/\s/g, '').trim() === '');
  // }

  get isEmptyModuleBackendFile() {
    return (this.rawContentBackend || '').replace(/\/\*\ \*\//g, '').trim().length === 0;
  }

  get relativePath() {
    const relativePath = crossPlatformPath(this.absFileSourcePathBrowserOrWebsql)
      .replace(`${this.compilationProject.location}/`, '')
      .replace(/^\//, '')
    return relativePath;
  }

  get isWebsqlMode() {
    return this.relativePath.startsWith(`tmp-src-${config.folder.dist}-${config.folder.websql}`) ||
      this.relativePath.startsWith(`tmp-src-${config.folder.bundle}-${config.folder.websql}`);
  }

  get absoluteBackendDestFilePath() {
    const absoluteBackendFilePath = path.join(
      this.compilationProject.location,
      this.relativePath.replace('tmp-src', 'tmp-source'), // .replace('-websql', '') // backend is ONE
    );
    return absoluteBackendFilePath;
  }

  //#endregion

  //#region constructor
  constructor(
    protected absSourcePathFromSrc: string,
    protected absFileSourcePathBrowserOrWebsql: string,
    private project?: Project,
    private compilationProject?: Project,
    private buildOptions?: BuildOptions,
    private sourceOutBrowser?: string,
  ) {

  }
  //#endregion

  init() {
    Helpers.copyFile(this.absSourcePathFromSrc, this.absFileSourcePathBrowserOrWebsql);
    this.absFileSourcePathBrowserOrWebsql = crossPlatformPath(this.absFileSourcePathBrowserOrWebsql);
    this.rawContentForBrowser = Helpers.readFile(this.absFileSourcePathBrowserOrWebsql, void 0, true) || '';
    this.rawContentBackend = this.rawContentForBrowser; // at the beginning those are normal files from src
    return this;
  }

  //#region methods
  debug(fileName: string) {
    // console.log('path.basename(this.absoluteFilePath)',path.basename(this.absoluteFilePath))
    this.isDebuggingFile = (path.basename(this.absFileSourcePathBrowserOrWebsql) === fileName);
  }

  public FLATTypescriptImportExport(usage: ConfigModels.TsUsage) {
    if (!this.absFileSourcePathBrowserOrWebsql.endsWith('.ts')) {
      return this;
    }
    const isExport = (usage === 'export');
    const fileContent: string = this.rawContentForBrowser;
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
      this.rawContentForBrowser = newFlatOutput;
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

  getParent() {
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
    return parent;
  }

  get additionalSmartPckages() {
    const parent = this.getParent();
    const additionalSmartPckages = (!parent ? [] : parent.children.map(c => `@${parent.name}/${c.name}`));

    return additionalSmartPckages;
  }

  protected getInlinePackage(packageName: string, packagesNames = BrowserCodeCut.IsomorphicLibs): Models.InlinePkg {
    const parent = this.getParent();

    packagesNames = packagesNames.concat([
      ...(parent ? [] : [this.project.name]),
      ...this.additionalSmartPckages,
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

  replaceFromLine(pkgName: string, imp: string) {
    // console.log(`Check package: "${pkgName}"`)
    // console.log(`imp: "${imp}"`)
    const inlinePkg = this.getInlinePackage(pkgName)

    if (inlinePkg.isIsomorphic) {
      // console.log('inlinePkg ', inlinePkg.realName)
      const replacedImp = imp.replace(
        inlinePkg.realName,
        `${inlinePkg.realName}/${this.buildOptions.websql ? config.folder.websql : config.folder.browser}`
      );

      this.rawContentForBrowser = this.rawContentForBrowser.replace(imp, replacedImp);
      return;
    }
    if (this.compilationProject.isWorkspaceChildProject && this.absFileSourcePathBrowserOrWebsql) {
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

            const regexAlreadyIs = new RegExp(`${pkgName}\/${Helpers.getBrowserVerPath(this.project && this.project.name, this.buildOptions.websql)}`);
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

            const regexAlreadyIs = new RegExp(`${pkgName}\/${Helpers.getBrowserVerPath(this.project && this.project.name, this.buildOptions.websql)}`);
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
          `${pkgName}/${Helpers.getBrowserVerPath(this.project && this.project.name, this.buildOptions.websql)}`);
        this.rawContentForBrowser = this.rawContentForBrowser.replace(orgImp, replacedImp);
        return;

      }
    }

  }

  REPLACERegionsFromTsImportExport(usage: ConfigModels.TsUsage) {
    // const debug = filesToDebug.includes(path.basename(this.absoluteFilePath));
    // if (debug) {
    //   debugger
    // }
    if (!this.absFileSourcePathBrowserOrWebsql.endsWith('.ts')
      // && !this.absoluteFilePath.endsWith('.tsx')
    ) {
      return this;
    }
    if (!_.isString(this.rawContentForBrowser)) return;
    const importRegex = new RegExp(`${usage}.+from\\s+(\\'|\\").+(\\'|\\")`, 'g');

    const asynMatches = (usage === 'import') ? this.rawContentForBrowser.match(regexAsyncImportG) : [];
    const normalMatches = this.rawContentForBrowser.match(importRegex);

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
    if (!this.absFileSourcePathBrowserOrWebsql.endsWith('.ts')
      // && !this.absoluteFilePath.endsWith('.tsx')
    ) {
      return this;
    }
    if (!_.isString(this.rawContentForBrowser)) return;
    // fileContent = IsomorphicRegions.flattenRequiresForContent(fileContent, usage)
    const importRegex = new RegExp(`require\\((\\'|\\").+(\\'|\\")\\)`, 'g')
    let imports = this.rawContentForBrowser.match(importRegex)
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

  get isInRelaseBundle() {
    return this.project.location.includes('tmp-bundle-release/bundle');
  };

  REPLACERegionsForIsomorphicLib(options: Models.dev.ReplaceOptionsExtended) {
    options = _.clone(options);
    this.options = options;
    // Helpers.log(`[REPLACERegionsForIsomorphicLib] options.replacements ${this.absoluteFilePath}`)
    const ext = path.extname(this.absFileSourcePathBrowserOrWebsql);
    // console.log(`Ext: "${ext}" for file: ${path.basename(this.absoluteFilePath)}`)
    if (BrowserCodeCut.extAllowedToReplace.includes(ext)) {
      this.rawContentForBrowser = this.project.sourceModifier.replaceBaslieneFromSiteBeforeBrowserCodeCut(this.rawContentForBrowser);

      const orgContent = this.rawContentForBrowser;
      this.rawContentForBrowser = RegionRemover.from(this.absFileSourcePathBrowserOrWebsql, orgContent, options.replacements, this.project).output;
      if ((this.project.isStandaloneProject || this.project.isSmartContainer) && !this.isWebsqlMode) {

        const regionsToRemove = ['@bro' + 'wser', '@web' + 'sqlOnly'];

        const orgContentBackend = this.rawContentBackend;
        this.rawContentBackend = RegionRemover.from(
          this.absoluteBackendDestFilePath,
          orgContentBackend,
          regionsToRemove,
          this.project
        ).output;

      }
    }

    // console.log(`isTarget fixing ? ${this.project.isSmartContainerTarget}`)
    // no modification of any code straight ng is being use




    // const slashAtBegin = BrowserCodeCut.extForStyles.includes(path.extname(this.absFileSourcePathBrowserOrWebsql));

    const pathname = this.project.isSmartContainerTarget ? this.project.smartContainerTargetParentContainer.name : this.project.name

    const basename = this.isInRelaseBundle ? `/${pathname}/` : '/';


    if (this.project.isSmartContainerTarget) {
      const parent = this.project.smartContainerTargetParentContainer;
      parent.children
        .filter(f => f.typeIs('isomorphic-lib'))
        .forEach(c => {
          const from = `${c.name}/src/assets/`;
          const to = `${basename}assets/assets-for/${parent.name + '--' + c.name}/`;
          this.rawContentForBrowser = this.rawContentForBrowser.replace(new RegExp(Helpers.escapeStringForRegEx(`/${from}`), 'g'), to);
          this.rawContentForBrowser = this.rawContentForBrowser.replace(new RegExp(Helpers.escapeStringForRegEx(from), 'g'), to);
        });
    } else if (this.project.isStandaloneProject) {
      [this.project]
        .filter(f => f.typeIs('isomorphic-lib'))
        .forEach(c => {
          const from = `src/assets/`;
          const to = `${basename}assets/assets-for/${c.name}/`;
          this.rawContentForBrowser = this.rawContentForBrowser.replace(new RegExp(Helpers.escapeStringForRegEx(`/${from}`), 'g'), to);
          this.rawContentForBrowser = this.rawContentForBrowser.replace(new RegExp(Helpers.escapeStringForRegEx(from), 'g'), to);
        });
    }

    return this;
  }

  private fixComments(s: string, fileAbsPath: string, endComment?: string) {
    if (!fileAbsPath.endsWith('.ts')) {
      return s;
    }

    const endOfFile = ((fileAbsPath.endsWith('.ts') && endComment) ? endComment : '');

    const splited = s.split('\n');
    return splited
      .map((line) => {
        if ((line.trimLeft().startsWith('// ') || line.trimLeft().startsWith('//#'))
          && (line.search('@ts-ignore') === -1)
        ) {
          return ''
        }
        return line;
      })
      .join('\n') + endOfFile;
  }

  private saveEmptyFile(isTsFile: boolean, endOfBrowserOrWebsqlCode: string) {
    if (!fse.existsSync(path.dirname(this.absFileSourcePathBrowserOrWebsql))) { // write empty instead unlink
      fse.mkdirpSync(path.dirname(this.absFileSourcePathBrowserOrWebsql));
    }
    if (isTsFile) {
      fse.writeFileSync(
        this.absFileSourcePathBrowserOrWebsql,
        `/* files for browser${this.isWebsqlMode
          ? '-websql' + endOfBrowserOrWebsqlCode
          : '' + endOfBrowserOrWebsqlCode
        } mode */`,
        'utf8'
      );
    } else {
      fse.writeFileSync(
        this.absFileSourcePathBrowserOrWebsql, ``,
        'utf8'
      );
    }
  }

  private saveNormalFile(isTsFile: boolean, endOfBrowserOrWebsqlCode: string, relativePath: string) {
    if (!fse.existsSync(path.dirname(this.absFileSourcePathBrowserOrWebsql))) {
      fse.mkdirpSync(path.dirname(this.absFileSourcePathBrowserOrWebsql));
    }
    if (isTsFile) {
      fse.writeFileSync(this.absFileSourcePathBrowserOrWebsql,
        this.fixComments(this.rawContentForBrowser, this.absFileSourcePathBrowserOrWebsql, endOfBrowserOrWebsqlCode),
        'utf8'
      );
      this.compilationProject.sourceModifier.processFile(
        relativePath,
        'tmp-src-for',
        this.buildOptions.websql,
      );
    } else {
      fse.writeFileSync(this.absFileSourcePathBrowserOrWebsql,
        this.rawContentForBrowser,
        'utf8'
      );
    }
  }

  private isAllowedPathForSave(relativePath: string) {
    return !relativePath.replace(/^\\/, '').startsWith(`tmp-src-dist/tests/`) &&
      !relativePath.replace(/^\\/, '').startsWith(`tmp-src-bundle/tests/`) &&
      !relativePath.replace(/^\\/, '').startsWith(`tmp-src-dist-websql/tests/`) &&
      !relativePath.replace(/^\\/, '').startsWith(`tmp-src-bundle-websql/tests/`);
  }

  save() {
    const relativePath = this.relativePath;

    // Helpers.log(`saving ismoprhic file: ${this.absoluteFilePath}`, 1)
    const isFromLibs = (_.first(relativePath.split('/').slice(1)) === config.folder.libs);
    const module = isFromLibs ? _.first(relativePath.split('/').slice(2)) : this.project.name; // taget
    const endOfBrowserOrWebsqlCode = `\n ${MjsModule.KEY_END_MODULE_FILE}${module} ${relativePath}`;
    const isTsFile = ['.ts'].includes(path.extname(this.absFileSourcePathBrowserOrWebsql));
    const backendFileSaveMode = !this.isWebsqlMode; // websql does not do anything on be


    if (this.isEmptyBrowserFile) {
      this.saveEmptyFile(isTsFile, endOfBrowserOrWebsqlCode);
    } else {
      this.saveNormalFile(isTsFile, endOfBrowserOrWebsqlCode, relativePath);
    }

    if (backendFileSaveMode) {
      const isEmptyModuleBackendFile = this.isEmptyModuleBackendFile;

      const absoluteBackendDestFilePath = this.absoluteBackendDestFilePath;
      if (!fse.existsSync(path.dirname(absoluteBackendDestFilePath))) {
        fse.mkdirpSync(path.dirname(absoluteBackendDestFilePath));
      }

      if (this.isAllowedPathForSave(relativePath)) {
        if (this.project.isSmartContainerTarget) {
          // console.log(relativePath)
          fse.writeFileSync(absoluteBackendDestFilePath,
            (isEmptyModuleBackendFile && isTsFile) ? `export function dummy${(new Date()).getTime()}() { }`
              : this.changeJsFileImportForOrgnanizaiton(this.rawContentBackend, absoluteBackendDestFilePath),
            'utf8');
        } else {
          // console.log(relativePath)
          fse.writeFileSync(absoluteBackendDestFilePath,
            (isEmptyModuleBackendFile && isTsFile) ? `export function dummy${(new Date()).getTime()}() { }`
              : this.rawContentBackend,
            'utf8');
        }
      }

    }
    // }
  }

  initAndSave(absPathTmpSrcDistBundleFolder: string) {

    absPathTmpSrcDistBundleFolder = crossPlatformPath(absPathTmpSrcDistBundleFolder);

    const relativePath = this.absFileSourcePathBrowserOrWebsql.replace(`${absPathTmpSrcDistBundleFolder}/`, '');

    if (!this.project.isSmartContainerTarget && relativePath.startsWith(`${config.folder.assets}/`)) {
      const absFileSourcePathBrowserOrWebsqlForAsset = this.absFileSourcePathBrowserOrWebsql
        .replace('/assets/', `/assets/assets-for/${this.project.name}/`);

      Helpers.copyFile(this.absSourcePathFromSrc, absFileSourcePathBrowserOrWebsqlForAsset);

    } else {
      // this is needed for css, html etc
      Helpers.copyFile(this.absSourcePathFromSrc, this.absFileSourcePathBrowserOrWebsql);

      // final straight copy to tmp-source-folder
      Helpers.copyFile(this.absFileSourcePathBrowserOrWebsql, this.absoluteBackendDestFilePath);
    }
  }

  changeJsFileImportForOrgnanizaiton(
    content: string,
    absFilePath: string,
  ) {
    if (!absFilePath.endsWith('.ts')) {
      return content;
    }

    const relative = crossPlatformPath(absFilePath)
      .replace(`${this.project.location}/`, '')
      .split('/')
      .slice(1)
      .join('/')
    // require("@codete-ngrx-quick-start/shared")

    const howMuchBack = (relative.split('/').length - 1);
    const additionalSmartPckages = this.additionalSmartPckages;
    for (let index = 0; index < additionalSmartPckages.length; index++) {
      const rootChildPackage = additionalSmartPckages[index];
      const [__, childName] = rootChildPackage.split('/');
      const back = (howMuchBack === 0) ? './' : _.times(howMuchBack).map(() => '../').join('');

      (() => {
        content = content.replace(
          new RegExp(`from\\s+(\\'|\\")${Helpers.escapeStringForRegEx(rootChildPackage)}(\\'|\\")`, 'g'),
          `from '${back}${config.folder.libs}/${childName}'`
        );
      })();

      (() => {
        content = content.replace(
          new RegExp(`from\\s+(\\'|\\")${Helpers.escapeStringForRegEx(rootChildPackage)}\\/`, 'g'),
          `from '${back}${config.folder.libs}/${childName}/`
        );
      })();

    }
    // Helpers.warn(`[copytomanager] Empty content for ${absFilePath}`);
    // console.log({ absFilePathJSJSJ: absFilePath })
    return content;
  }


  //#endregion

}
