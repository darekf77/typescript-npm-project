
import * as fs from 'fs';
import * as _ from 'lodash';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as glob from 'glob';
import * as watch from 'watch'

import { ModifyTsFileActionBase } from './modify-ts-file-action-base.backend';
import { Helpers } from '../../../../index';
import { HelpersMerge } from 'tnp-helpers';
import { config } from '../../../../config';
import { Project } from '../../../index';

/**
 * Replace imports/export
 * Scope: current files baseline path in current generated file
 * Example:
 *  File: exmpale.ts
 *   Code change:
 *     From  : `import {..} from 'baseline/exapmle.ts`
 *     To    : `import {..} from './__exapmle.ts`
 *
 * Notes:
 *  Problem1 : If import `import {..} from 'baseline/exapmle.ts` is included in different files
 * than example.ts it is not going to be excluded
 */
export class HandlePrefixingFileToEasyOverride extends ModifyTsFileActionBase {
  constructor(public project: Project, private debuggin: boolean) {
    super()
  }

  action(relativeBaselineCustomPath, input) {

    const baselineFilePathNoExit = HelpersMerge.PathHelper.removeExtension(relativeBaselineCustomPath);
    if (this.debuggin) Helpers.log(`[replace][1] baselineFilePathNoExit: ${baselineFilePathNoExit}`)

    const toReplaceImportPath =
      Helpers.escapeStringForRegEx(
        `${path.join(HelpersMerge.pathToBaselineNodeModulesRelative(this.project)
          .replace(/\//g, '//'),
          baselineFilePathNoExit)}`
      )

    const replacement = `./${HelpersMerge.getPrefixedBasename(baselineFilePathNoExit)}`;

    // if (debuggin) Helpers.log(`toReplaceImportPath: ${toReplaceImportPath}`)
    if (this.debuggin) Helpers.log(`[replace][1] replacement: ${replacement}`)

    const replaceRegex = new RegExp(`(\"|\')${toReplaceImportPath}(\"|\')`, 'g')

    if (this.debuggin) {
      Helpers.log(`[replace][1] replaceRegex: ${replaceRegex.source}`)
    }

    input = input.replace(replaceRegex, `'${replacement}'`);
    if (this.debuggin) Helpers.log(`
[replace][1] result input:
${Helpers.terminalLine()}
    ${input}
${Helpers.terminalLine()}
    `)

    return input;
  }
}
