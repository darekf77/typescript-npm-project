//#region @backend
import * as _ from 'lodash';

import { CodeCut, BrowserCodeCut } from 'morphi/build';
import { ReplaceOptionsExtended } from './models';
import { EnvConfig } from '../models';




export class ExtendedCodeCut extends CodeCut {

  constructor(protected cwd: string, filesPathes: string[], options: ReplaceOptionsExtended) {
    super(cwd, filesPathes, options as any);
    this.browserCodeCut = BrowserCodeCutExtended;
  }

}

const customReplacement = '@customReplacement';

export class BrowserCodeCutExtended extends BrowserCodeCut {



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


//#endregion
