import * as _ from 'lodash';
import * as path from 'path';
import * as fse from 'fs-extra';
import * as sass from 'node-sass';

import { CodeCut, BrowserCodeCut, TsUsage } from 'morphi/build';
import { Models } from '../../../models';
import { Helpers } from '../../../helpers';
import { config } from '../../../config';
import { Project } from '../../abstract';

import { IncrementalBuildProcessExtended } from './incremental-build-process';
import { BuildOptions } from '../../features/build-process';



export class ExtendedCodeCut extends CodeCut {

  browserCodeCut: any;

  constructor(
    protected cwd: string, filesPathes: string[], options: Models.dev.ReplaceOptionsExtended,
    /**
     * it may be not available for global, for all compilatoin
     */
    private project: Project,
    private compilationProject: Project,
    private buildOptions: BuildOptions,

  ) {
    super(cwd, filesPathes, options as any);
    this.browserCodeCut = BrowserCodeCutExtended;
  }

  file(absolutePathToFile) {

    // console.log('options here ', options)
    return new (this.browserCodeCut)(absolutePathToFile, this.project, this.compilationProject, this.buildOptions)
      .flatTypescriptImportExport('import')
      .flatTypescriptImportExport('export')
      .replaceRegionsForIsomorphicLib(_.cloneDeep(this.options))
      .replaceRegionsFromTsImportExport('import')
      .replaceRegionsFromTsImportExport('export')
      .replaceRegionsFromJSrequire()
      .saveOrDelete();
  }

}

export class BrowserCodeCutExtended extends BrowserCodeCut {

  // private debugging = false;

  get allowedToReplace() {
    return ['ts', 'html', 'css', 'sass', 'scss'] as Models.other.CutableFileExt[];
  }

  constructor(
    absoluteFilePath: string,
    private project?: Project,
    private compilationProject?: Project,
    private buildOptions?: BuildOptions,
  ) {
    super(absoluteFilePath);
    // this.debug('modal.service.ts');
    // console.log('Build Options', buildOptions)
  }

  afterRegionsReplacement(content: string) {
    const contentFromMorphi = content;
    let absoluteFilePath = this.absoluteFilePath.replace(/\/$/, '');

    let useBackupFile = false;
    ['html', 'css', 'scss', 'sass']
      .map(d => `.${d}`)
      .forEach(ext => {
        if (!useBackupFile && absoluteFilePath.endsWith(ext)) {
          absoluteFilePath = absoluteFilePath.replace(ext, '.ts');
          useBackupFile = true;
        }
      });

    const orgContentPath = `${absoluteFilePath}.orginal`;
    if (useBackupFile) {
      Helpers.writeFile(this.absoluteFilePath, contentFromMorphi)
      if (fse.existsSync(orgContentPath)) {
        const backuContent = Helpers.readFile(orgContentPath)
        if (backuContent.trim() !== '') {
          content = backuContent;
        } else {
          return content;
        }
      } else if (fse.existsSync(absoluteFilePath)) {
        const orgContent = Helpers.readFile(absoluteFilePath);
        if (orgContent.trim() !== '') {
          Helpers.writeFile(orgContentPath, orgContent)
          content = orgContent;
        } else {
          return content;
        }
      } else {
        return content;
      }
    }

    if (['module', 'component']
      .map(c => `.${c}.ts`)
      .filter(c => absoluteFilePath.endsWith(c)).length === 0) {
      return content;
    }

    const dir = path.dirname(absoluteFilePath);
    const base = path.basename(absoluteFilePath)
      .replace(/\.(component|module)\.ts$/, '');

    // if () {
    //   console.log('HEHEHHEHEH', absoluteFilePath)
    // }

    // this.debugging = !!~absoluteFilePath.search('process-info-message.component')
    // this.debugging && console.log(absoluteFilePath)

    content = this.replaceHtmlTemplateInComponent(dir, base, content)
    content = this.replaceCssInComponent(dir, base, content)
    content = this.replaceSCSSInComponent(dir, base, content, 'scss', absoluteFilePath)
    content = this.replaceSCSSInComponent(dir, base, content, 'sass', absoluteFilePath)
    // if (this.debugging) {
    //   process.exit(0)
    // }

    if (useBackupFile) {
      Helpers.writeFile(absoluteFilePath, content)
      return contentFromMorphi;
    }
    return content;
  }

  protected handleTickInCode(replacement: string): string {
    if (replacement.search('`') !== -1) {
      Helpers.error(`[browsercodecut] Please dont use tick \` ... in ${path.basename(this.absoluteFilePath)}`, true, true)
      replacement = replacement.replace(/\`/g, '\\`');
    }
    return replacement;
  }

  private handleOutput(replacement: string, ext: Models.other.CutableFileExt): string {
    replacement = this.handleTickInCode(replacement);

    return replacement;
  }

  private replaceHtmlTemplateInComponent(dir, base, content) {
    const htmlTemplatePath = path.join(dir, `${base}.component.html`);
    let replacement = ` <!-- File ${base}.component.html  does not exist -->`
    if (fse.existsSync(htmlTemplatePath)) {

      // console.log(`regex: ${regex}`)
      replacement = Helpers.readFile(htmlTemplatePath);

      if (!_.isString(replacement) || replacement.trim() === '') {
        replacement = `
        <!-- Put your html here -->
        `;
      }
    }
    const regex = `(templateUrl)\\s*\\:\\s*(\\'|\\")?\\s*(\\.\\/)?${
      Helpers.escapeStringForRegEx(path.basename(htmlTemplatePath))
      }\\s*(\\'|\\")`;
    content = content.replace(
      new RegExp(regex,
        'g'),
      'template: \`\n' + this.handleOutput(replacement, 'html') + '\n\`')

    return content;
  }

  private replaceCssInComponent(dir, base, content) {
    const cssFilePath = path.join(dir, `${base}.component.css`);
    let replacement = `
      /* file ${base}.component.css does not exist */
    `;
    if (fse.existsSync(cssFilePath)) {

      // console.log(`regex: ${regex}`)
      replacement = Helpers.readFile(cssFilePath);
      if (!_.isString(replacement) || replacement.trim() === '') {
        replacement = `
        /* put your styles here */
        `;
      }
    }
    const regex = `(styleUrls)\\s*\\:\\s*\\[\\s*(\\'|\\")?\\s*(\\.\\/)?${
      Helpers.escapeStringForRegEx(path.basename(cssFilePath))
      }\s*(\\'|\\")\\s*\\]`;
    content = content.replace(
      new RegExp(regex,
        'g'),
      'styles: [\`\n' + this.handleOutput(replacement, 'css') + '\n\`]')

    return content;
  }

  private replaceSCSSInComponent(dir, base, content, ext: 'scss' | 'sass', absoluteFilePath) {

    const scssFilePath = path.join(dir, `${base}.component.${ext}`);
    // this.debugging && console.log(`(${ext}) scssFilePath`, scssFilePath)
    let replacement = `
    /* file ${base}.component.${ext} does not exist */
  `;
    if (fse.existsSync(scssFilePath)) {
      const contentScss = Helpers.readFile(scssFilePath);
      // this.debugging && console.log(`content of file:\n${contentScss}`)

      if (contentScss.trim() !== '') {
        try {
          const compiled = sass.renderSync({
            data: contentScss,
          })
          replacement = compiled.css;
          replacement = _.isObject(replacement) ? replacement.toString() : replacement;
          // this.debugging && console.log('compiled', compiled)
          // this.debugging && console.log('compiled.css', compiled.css)
          // this.debugging && console.log('typeof compiled.css', typeof compiled.css)
          // this.debugging && console.log('compiled.css.toString', compiled.css.toString())
        } catch (e) {
          // this.debugging && console.log('erorororor', e);
          // error(error, true, true);
          Helpers.error(`[browser-code-dut] There are errors in your sass file: ${absoluteFilePath} `, true, true);
        }
      }

      if (!_.isString(replacement) || replacement.trim() === '') {
        replacement = `
        /* put your styles here */
        `;
      }
    }

    const regex = `(styleUrls)\\s*\\:\\s*\\[\\s*(\\'|\\")?\\s*(\\.\\/)?${
      Helpers.escapeStringForRegEx(path.basename(scssFilePath))
      }\s*(\\'|\\")\\s*\\]`;
    // console.log(`regex: ${regex}`)
    content = content.replace(
      new RegExp(regex,
        'g'),
      'styles: [\`\n' + this.handleOutput(replacement, ext) + '\n\`]')

    return content;
  }
  private findReplacements(
    stringContent: string,
    pattern: string,
    codeCuttFn: (jsExpressionToEval: string,
      env: Models.env.EnvConfig,
      absoluteFilePath: string) => boolean,
    ext: Models.other.CutableFileExt = 'ts'
  ) {
    // this.isDebuggingFile && console.log(`[findReplacements] START EXT: "${ext}"`)
    // const handleHtmlRegex = (ext === 'html' ? '\\s+\\-\\-\\>' : '');
    const handleHtmlString = (ext === 'html' ? ' -->' : '');
    const customReplacement = '@customReplacement';
    // this.isDebuggingFile && console.log(pattern)

    // this.isDebuggingFile && console.log(`[findReplacements] pattern: "${pattern}"`)

    const replacements = [];
    // console.log('WORD is fun')
    stringContent = stringContent.split('\n')
      .filter(f => !!f.trim())
      .map(line => {
        // this.isDebuggingFile && console.log(`[LINE] "${line}"`)
        const indexPatternStart = line.search(pattern);
        if (indexPatternStart !== -1) {
          const value = line.substr(indexPatternStart + pattern.length).trim();
          // this.isDebuggingFile && console.log(`[findReplacements] value: "${value}"`)
          // this.isDebuggingFile && console.log('value: ' + value)
          // value = value.trim().replace(/\-\-\>$/, '')
          if (codeCuttFn(value.replace(/\-\-\>$/, ''), this.project && this.project.env.config, this.absoluteFilePath)) {
            // this.isDebuggingFile && console.log('[findReplacements] CUT CODE ! ')

            const regexRep = new RegExp(`${pattern}\\s+${Helpers.escapeStringForRegEx(value)}`, 'g');
            // this.isDebuggingFile && console.log(`[findReplacements] value: "${regexRep.source}"`)

            // this.isDebuggingFile && console.log(regexRep.source)
            line = line.replace(regexRep, customReplacement + handleHtmlString);
            replacements.push(customReplacement);
          } else {
            // this.isDebuggingFile && console.log(`[findReplacements] DO NOT CUT CODE ! `)
          }
        }
        return line;
      })
      .join('\n')
    return {
      stringContent,
      replacements
    };
  }

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
      const child = this.compilationProject.parent.child(pkgName, false);
      if (child && this.buildOptions && !this.buildOptions.appBuild) {
        // console.log(`child founded: ${pkgName}`)
        const orgImp = imp;
        let proceed = true;
        if (child.type === 'isomorphic-lib') {
          const sourceRegex = `${pkgName}\/(${config.moduleNameIsomorphicLib.join('|')})(?!\-)`;
          const regex = new RegExp(sourceRegex);
          // console.log(`[isomorphic-lib] Regex source: "${sourceRegex}"`)
          if (regex.test(imp)) {
            // console.log(`[isom] MATCH: ${imp}`)
            imp = imp.replace(regex, pkgName);
          } else {

            const regexAlreadyIs = new RegExp(`${pkgName}\/${IncrementalBuildProcessExtended
              .getBrowserVerPath(this.project && this.project.name)}`);
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

            const regexAlreadyIs = new RegExp(`${pkgName}\/${IncrementalBuildProcessExtended
              .getBrowserVerPath(this.project && this.project.name)}`);
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
          `${pkgName}/${IncrementalBuildProcessExtended
            .getBrowserVerPath(this.project && this.project.name)}`);
        this.rawContent = this.rawContent.replace(orgImp, replacedImp);
        return;

      }
    }

  }

  replaceRegionsForIsomorphicLib(options: Models.dev.ReplaceOptionsExtended) {

    options = _.clone(options);
    // console.log('options.replacements', options.replacements)
    const ext = path.extname(this.absoluteFilePath).replace('.', '') as Models.other.CutableFileExt;
    // console.log(`Ext: "${ext}" for file: ${path.basename(this.absoluteFilePath)}`)
    if (this.allowedToReplace.includes(ext)) {
      this.rawContent = this.project.sourceModifier.replaceBaslieneFromSiteBeforeBrowserCodeCut(this.rawContent);
      this.rawContent = this.replaceRegionsWith(this.rawContent, options.replacements, '', ext);
    }
    this.rawContent = this.afterRegionsReplacement(this.rawContent);
    return this;
  }

  protected REGEX_REGION_HTML(word) {
    const regex = new RegExp("[\\t ]*\\<\\!\\-\\-\\s*#?region\\s+" +
      word + " ?[\\s\\S]*?\\<\\!\\-\\-\\s*#?endregion\\s\\-\\-\\> ?[\\t ]*\\n?", "g");
    // this.isDebuggingFile && console.log(regex.source)
    return regex;
  }

  debug(fileName: string) {
    // console.log('path.basename(this.absoluteFilePath)',path.basename(this.absoluteFilePath))
    if (this.project) {
      this.isDebuggingFile = true; // (path.basename(this.absoluteFilePath) === fileName);
    }

  }

  replaceRegionsWith(stringContent = '', replacementPatterns = [], replacement = '',
    ext: Models.other.CutableFileExt = 'ts') {

    if (replacementPatterns.length === 0) {
      return stringContent;
    }
    let pattern = replacementPatterns.shift();
    // console.log('replacementPatterns', replacementPatterns)
    if (Array.isArray(pattern) && pattern.length === 2) {
      const cutCodeFnOrString = pattern[1] as Function;
      pattern = pattern[0] as string;
      if (_.isFunction(cutCodeFnOrString)) {
        const rep = this.findReplacements(stringContent, pattern, cutCodeFnOrString, ext);
        // this.isDebuggingFile && console.log('replacements', replacements)
        // this.isDebuggingFile && console.log('replacements', rep.replacements)
        return this.replaceRegionsWith(rep.stringContent, rep.replacements.concat(replacementPatterns), '', ext);
      } else {
        replacement = cutCodeFnOrString as any;
      }
    }
    if (ext === 'html') {
      stringContent = stringContent.replace(this.REGEX_REGION_HTML(pattern), replacement);
    } else {
      stringContent = stringContent.replace(this.REGEX_REGION(pattern), replacement);
    }

    // this.isDebuggingFile && console.log(`-------------------------- ${pattern} --------------------------------`)
    // this.isDebuggingFile && console.log(stringContent)
    return this.replaceRegionsWith(stringContent, replacementPatterns, '', ext);
  }

}
