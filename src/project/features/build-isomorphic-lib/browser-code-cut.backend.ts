import * as _ from 'lodash';
import * as path from 'path';
import * as fse from 'fs-extra';
import * as sass from 'node-sass';

import { CodeCut, BrowserCodeCut } from 'morphi/build';
import { EnvConfig, ReplaceOptionsExtended } from '../../../models';
import { error } from '../../../helpers';



export class ExtendedCodeCut extends CodeCut {

  constructor(protected cwd: string, filesPathes: string[], options: ReplaceOptionsExtended) {
    super(cwd, filesPathes, options as any);
    this.browserCodeCut = BrowserCodeCutExtended;
  }

}

const customReplacement = '@customReplacement';

export class BrowserCodeCutExtended extends BrowserCodeCut {

  // private debugging = false;

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
      fse.writeFileSync(this.absoluteFilePath, contentFromMorphi, { encoding: 'utf8' })
      if (fse.existsSync(orgContentPath)) {
        const backuContent = fse.readFileSync(orgContentPath, { encoding: 'utf8' })
        if (backuContent.trim() !== '') {
          content = backuContent;
        } else {
          return content;
        }
      } else if (fse.existsSync(absoluteFilePath)) {
        const orgContent = fse.readFileSync(absoluteFilePath, { encoding: 'utf8' })
        if (orgContent.trim() !== '') {
          fse.writeFileSync(orgContentPath, orgContent, { encoding: 'utf8' })
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
      fse.writeFileSync(absoluteFilePath, content, { encoding: 'utf8' })
      return contentFromMorphi;
    }
    return content;
  }

  private replaceHtmlTemplateInComponent(dir, base, content) {
    const htmlTemplatePath = path.join(dir, `${base}.component.html`);
    if (fse.existsSync(htmlTemplatePath)) {
      const regex = `(templateUrl)\\s*\\:\\s*(\\'|\\")?\\s*(\\.\\/)?${path.basename(htmlTemplatePath)}\\s*(\\'|\\")`;
      // console.log(`regex: ${regex}`)
      let replacement = fse.readFileSync(htmlTemplatePath, { encoding: 'utf8' }).toString()

      if (!_.isString(replacement) || replacement.trim() === '') {
        replacement = `
        <!-- Put your html here -->
        `;
      }

      content = content.replace(
        new RegExp(regex,
          'g'),
        'template: \`\n' + replacement + '\n\`')
    }
    return content;
  }

  private replaceCssInComponent(dir, base, content) {
    const cssFilePath = path.join(dir, `${base}.component.css`);
    if (fse.existsSync(cssFilePath)) {
      const regex = `(styleUrls)\\s*\\:\\s*\\[\\s*(\\'|\\")?\\s*(\\.\\/)?${path.basename(cssFilePath)}\s*(\\'|\\")\\s*\\]`;
      // console.log(`regex: ${regex}`)
      let replacement = fse.readFileSync(cssFilePath, { encoding: 'utf8' }).toString()
      if (!_.isString(replacement) || replacement.trim() === '') {
        replacement = `
        // put your styles here
        `;
      }

      content = content.replace(
        new RegExp(regex,
          'g'),
        'styles: [\`\n' + replacement + '\n\`]')
    }
    return content;
  }

  private replaceSCSSInComponent(dir, base, content, ext: 'scss' | 'sass', absoluteFilePath) {

    const scssFilePath = path.join(dir, `${base}.component.${ext}`);
    // this.debugging && console.log(`(${ext}) scssFilePath`, scssFilePath)
    if (fse.existsSync(scssFilePath)) {
      const contentScss = fse.readFileSync(scssFilePath, { encoding: 'utf8' }).toString()
      // this.debugging && console.log(`content of file:\n${contentScss}`)
      let replacement = '';
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
          error(`[browser-code-dut] There are errors in your sass file: ${absoluteFilePath} `, true, true);
        }
      }

      if (!_.isString(replacement) || replacement.trim() === '') {
        replacement = `
        // put your styles here
        `;
      }

      const regex = `(styleUrls)\\s*\\:\\s*\\[\\s*(\\'|\\")?\\s*(\\.\\/)?${path.basename(scssFilePath)}\s*(\\'|\\")\\s*\\]`;
      // console.log(`regex: ${regex}`)
      content = content.replace(
        new RegExp(regex,
          'g'),
        'styles: [\`\n' + replacement + '\n\`]')
    }
    return content;
  }



  private findReplacements(stringContent: string, pattern: string, fun: (jsExpressionToEval: string, env: EnvConfig) => boolean) {

    // this.isDebuggingFile && console.log(pattern)

    const replacements = [];
    // console.log('WORD is fun')
    stringContent = stringContent.split('\n')
      .filter(f => !!f.trim())
      .map(line => {
        const indexPatternStart = line.search(pattern);
        if (indexPatternStart !== -1) {
          const value = line.substr(indexPatternStart + pattern.length).trim();
          // this.isDebuggingFile && console.log('value: ' + value)
          if (fun(value, this.customEnv)) {
            // console.log('MATCH!: ' + value)
            const regexRep = new RegExp(`${pattern}\\s+${value}`, 'g');
            // this.isDebuggingFile && console.log(regexRep.source)
            line = line.replace(regexRep, customReplacement);
            replacements.push(customReplacement);
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


  customEnv: EnvConfig;

  replaceRegionsForIsomorphicLib(options: ReplaceOptionsExtended) {

    this.debug('TestService.ts')
    this.customEnv = options.env;
    return super.replaceRegionsForIsomorphicLib(_.clone(options) as any);
  }

  replaceRegionsWith(stringContent = '', replacementPatterns = [], replacement = '') {

    if (replacementPatterns.length === 0) return stringContent;
    let pattern = replacementPatterns.shift();
    // console.log('replacementPatterns', replacementPatterns)
    if (Array.isArray(pattern) && pattern.length === 2) {
      const funOrString = pattern[1] as Function;
      pattern = pattern[0] as string;
      if (_.isFunction(funOrString)) {
        const rep = this.findReplacements(stringContent, pattern, funOrString);
        // this.isDebuggingFile && console.log('replacements', replacements)
        return this.replaceRegionsWith(rep.stringContent, rep.replacements.concat(replacementPatterns));
      } else {
        replacement = funOrString as any;
      }
    }

    stringContent = stringContent.replace(this.REGEX_REGION(pattern), replacement);
    // this.isDebuggingFile && console.log(`-------------------------- ${pattern} --------------------------------`)
    // this.isDebuggingFile && console.log(stringContent)
    return this.replaceRegionsWith(stringContent, replacementPatterns);
  }

}
