import * as fs from 'fs';
import * as _ from 'lodash';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as glob from 'glob';
import * as watch from 'watch'
import * as rimraf from 'rimraf';

import { ModifyTsFileActionBase } from './modify-ts-file-action-base.backend';
import { Helpers } from '../../../../index';
import { HelpersMerge } from '../merge-helpers.backend';
import { config } from '../../../../config';
import { Project } from '../../../index';

/**
 * FIST PROBLEM:
 * Handle situation when in site you are refering to angular-lib baseline module
 * ex:
 * `import { Helpers } from 'angular-lib-name/(components/module/browser/dist)/helpers-path'`
 *                                                        <- will be repaled do browser ->
 *
 * SECOND PROBLEM:
 * Handle situation when in site you are refering to angular-lib baseline module
 * ex:
 * `import { Helpers } from 'baseline-name/angular-lib-name/(components/module/browser/dist)/helpers-path'`
 *                                                        <- will be repaled do browser ->
 */
export class HandleReferingToAndularLibModuleName extends ModifyTsFileActionBase {
  constructor(public project: Project, private debuggin: boolean) {
    super()
  }

  action(relativeBaselineCustomPath, input) {
    // Helpers.log(`relativeBaselineCustomPath: "${relativeBaselineCustomPath}"`)
    if (this.project.isWorkspaceChildProject) {
      input = this.project.sourceModifier.process(input, relativeBaselineCustomPath);
    }
    if (this.debuggin) Helpers.log(`
[replace][2] result input:
${Helpers.terminalLine()}
  ${input}
${Helpers.terminalLine()}
  `)
    return input;
  }

}
