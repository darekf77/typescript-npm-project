import * as fs from 'fs';
import * as _ from 'lodash';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as glob from 'glob';
import * as watch from 'watch'

import { ModifyTsFileActionBase } from './modify-ts-file-action-base.backend';
import { Helpers } from '../../../../index';
import { HelpersMerge } from '../merge-helpers.backend';
import { config } from '../../../../config';
import { Project } from '../../../index';


/**
 * Same thing like in currentFilePath() but:
 *  - handle situation like in Problem1;
 *  - handle situation when in your custom files you are referening to custom files
 */
export class HandleReferingToBaselinePathes extends ModifyTsFileActionBase {

  constructor(public project: Project) {
    super()
  }

  action(relativeBaselineCustomPath, input) {
    relativeBaselineCustomPath = `/${relativeBaselineCustomPath}`;
    const debuggin = (config.debug.baselineSiteJoin.DEBUG_PATHES
      .includes(relativeBaselineCustomPath));

    if (debuggin) Helpers.log(`

    relativeBaselineCustomPath:${relativeBaselineCustomPath}


    `)
    const levelBack = relativeBaselineCustomPath.split('/').length - 3;
    const levelBackPath = _.times(levelBack, () => '../').join('').replace(/\/$/g, '');
    if (debuggin) Helpers.log(`[replace][3] Level back for ${relativeBaselineCustomPath} is ${levelBack} ${levelBackPath}`)
    const tmpPathToBaselineNodeModulesRelative = Helpers
      .escapeStringForRegEx(HelpersMerge.pathToBaselineNodeModulesRelative(this.project))
    debuggin && Helpers.log(`[replace][3] tmpPathToBaselineNodeModulesRelative: ${tmpPathToBaselineNodeModulesRelative}`)
    let patterns = this.getPattern(input, tmpPathToBaselineNodeModulesRelative, debuggin);

    if (debuggin) Helpers.log(`[replace][3] recognized patterns\n
      ${_.isArray(patterns) && patterns.map(d => `\t${d}`).join('\n')}
    `);



    if (Array.isArray(patterns) && patterns.length >= 1) {
      patterns.forEach(pathToReplaceInInput => {

        if (debuggin) Helpers.log(`[replace][3] PATTERN IN INPUT ${pathToReplaceInInput}`)
        if (debuggin) Helpers.log(`[replace][3] BASELINE: ${HelpersMerge.pathToBaselineNodeModulesRelative(this.project)}`);
        let patternWithoutBaselinePart = pathToReplaceInInput
          .replace(HelpersMerge.pathToBaselineNodeModulesRelative(this.project), '')
        if (debuggin) Helpers.log(`[replace][3] PATTERN WITHOUT BASELINE:${patternWithoutBaselinePart}`)
        if (debuggin) Helpers.log(`[replace][3] pathPart = ${config.regexString.pathPartStringRegex}`)

        patternWithoutBaselinePart = HelpersMerge.PathHelper.removeRootFolder(patternWithoutBaselinePart);

        if (debuggin) Helpers.log(`[replace][3] PATTERN WITHOUT BASELINE no path part : ${patternWithoutBaselinePart}`)
        const toReplace = `${levelBackPath}${patternWithoutBaselinePart}`
        if (debuggin) Helpers.log(`[replace][3] toReplace:${toReplace}`)
        input = input.replace(pathToReplaceInInput, `.${toReplace}`.replace('...', '..'))
      })
    }
    if (debuggin) Helpers.log(`
[replace][3] result input:
${Helpers.terminalLine()}
    ${input}
${Helpers.terminalLine()}
    `)
    return input;
  }

  /**
   *   "baseline/ss-common-logic/src/db-mocks";
   *                            |<--------->|
   */
  getPattern(input: string, tmpPathToBaselineNodeModulesRelative: string,
    debuggin: boolean) {

    if (debuggin) Helpers.log(`[replace][3] pathPart ${config.regexString.pathPartStringRegex}`)
    const baselineRegex = `${tmpPathToBaselineNodeModulesRelative}${config.regexString.pathPartStringRegex}*`
    if (debuggin) Helpers.log(`[replace][3] \nbaselineRegex: ${baselineRegex}`)
    let patterns = input.match(new RegExp(baselineRegex, 'g'))
    return patterns;
  }

}
