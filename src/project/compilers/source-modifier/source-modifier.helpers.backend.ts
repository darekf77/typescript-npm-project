import * as _ from 'lodash';
import { ImpReplaceOptions } from './source-modifier.models';
import { Helpers } from '../../../index';
import { config } from '../../../config';


export function impReplace(impReplaceOptions: ImpReplaceOptions) {
  let { input, name, urlParts, modType, notAllowedAfterSlash, partsReplacementsOptions,
    debugMatch, debugNotMatch } = impReplaceOptions;
  const { partsReplacements, project, relativePath, method, } = impReplaceOptions;

  if (!partsReplacementsOptions) {
    partsReplacementsOptions = {};
  }
  if (_.isUndefined(partsReplacementsOptions.replaceWhole)) {
    partsReplacementsOptions.replaceWhole = false;
  }
  const { replaceWhole } = partsReplacementsOptions;


  // if (relativePath === 'src/app/app.component.ts') {
  //   debugMatch = true;
  //   debugNotMatch = true;
  // }


  name = name.replace(/\n/g, ' ')

  let urlPartsString: string;
  if (urlParts instanceof RegExp) {
    urlPartsString = urlParts.source;
    // Helpers.log(`regex urlPartsString: "${urlPartsString}"`)
  } else {
    urlParts = urlParts.map(p => {
      if (_.isArray(p)) {
        return `(${p
          .map(part => {
            if (part === config.folder.browser) {
              return `${Helpers.escapeStringForRegEx(part)}(?!\\-)`;
            }
            return Helpers.escapeStringForRegEx(part);
          }).join('|')})`;
      }
      if (_.isString(p)) {
        return Helpers.escapeStringForRegEx(p);
      }
    });
    urlPartsString = urlParts.join(`\\/`);
  }



  if (_.isArray(notAllowedAfterSlash)) {
    notAllowedAfterSlash = notAllowedAfterSlash.map(p => {
      if (_.isArray(p)) {
        return `(${p
          .map(part => {
            return Helpers.escapeStringForRegEx(part);
          }).join('|')})`;
      }
      if (_.isString(p)) {
        return Helpers.escapeStringForRegEx(p);
      }
    });
  }


  modType = modType ? modType : 'BROWSER' as any;

  let arr: { regexSource: string; replacement: string; description: string; }[] = [];
  if (replaceWhole) {
    arr = [
      {
        regexSource: `(\\"|\\')${urlPartsString}.*(\\"|\\')`,
        replacement: `'${partsReplacements.join('/')}'`,
        description: `exactly between whole imporrt`
      }
    ];
  } else {
    arr = [
      {
        regexSource: `(\\"|\\')${urlPartsString}(\\"|\\')`,
        replacement: `'${partsReplacements.join('/')}'`,
        description: `exactly between apostrophes`
      },
      {
        regexSource: `(\\"|\\')${urlPartsString}\\/${notAllowedAfterSlash ? `(?!(${notAllowedAfterSlash.join('|')}))` : ''}`,
        replacement: `'${partsReplacements.join('/')}/`,
        description: `between apostrophe and slash`
      },
    ];
  }



  for (let index = 0; index < arr.length; index++) {
    const element = arr[index];
    const regex = new RegExp(element.regexSource, 'g');
    const isMatch = regex.test(input);
    input = Helpers.tsCodeModifier.replace(input, regex, element.replacement);
    if (isMatch) {
      debugMatch && Helpers.info(`(${modType})(${project.isSite ? 'SITE - ' :
        ''}"${project.genericName}") (${element.description})` +
        `\nMATCH: ${element.regexSource}` +
        `\nREGEX: ${element.regexSource}`) +
        `\nFILE: ${relativePath}\n`;
    } else {
      debugNotMatch && Helpers.log(`(${modType})(${project.isSite ? 'SITE - ' :
        ''}"${project.genericName}") (${element.description})` +
        `\nDON'T MATCH: ${element.regexSource}` +
        `\nDON'T REGEX: ${element.regexSource}`) +
        `\nFILE: ${relativePath}\n`;
    }
  }



  return input;
}
