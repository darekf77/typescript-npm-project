//#region @backend
import * as _ from 'lodash';
import { CodeTransform } from 'morphi/build-tool/isomorphic/code-transform';

export class CodeTransformExtended extends CodeTransform {


  private findReplacements(stringContent: string, pattern, fun, ) {

    const replacements = [];
    // console.log('WORD is fun')
    stringContent.split('\n').map(line => {
      const value = line.substr(line.search(pattern) + pattern.length).trim();
      // console.log('value: ' + value)
      if (fun(value.replace(/(\'|\")/g, ''))) {
        // console.log('MATCH!: ' + value)
        replacements.push(`${pattern}${value}\n`);
      }
    })
    return replacements;
  }

  replaceRegionsWith(stringContent = '', replacementPatterns = [], replacement = '') {

    if (replacementPatterns.length === 0) return stringContent;
    let pattern = replacementPatterns.shift();
    // console.log('replacementPatterns', replacementPatterns)
    if (Array.isArray(pattern) && pattern.length === 2) {
      const funOrString = pattern[1] as Function;
      pattern = pattern[0] as string;
      if (_.isFunction(funOrString)) {
        const replacements = this.findReplacements(stringContent, pattern, funOrString);
        return this.replaceRegionsWith(stringContent, replacementPatterns.concat(replacements));
      } else {
        replacement = funOrString as any;
      }
    }

    stringContent = stringContent.replace(this.REGEX_REGION(pattern), replacement);
    return this.replaceRegionsWith(stringContent, replacementPatterns);
  }

  // replaceRegionsForIsomorphicLib() {
  //   const isWithEnv = _.isObject(CodeTransform.ENV);

  //   this.rawContent = this.replaceRegionsWith(this.rawContent, [

  //     ["@backendFunc", `return undefined;`],
  //     "@backend",

  //     ["@cutExpression ", function (e, expression) {
  //       return isWithEnv && eval(`(function(ENV){ ${expression} })(e)`);
  //     }]

  //   ], '')
  //   return this;
  // }

}

//#endregion
