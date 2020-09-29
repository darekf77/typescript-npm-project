//#region imports
import * as fs from 'fs';
import * as _ from 'lodash';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as glob from 'glob';
import * as watch from 'watch'
// local
import { SourceModifier } from '../source-modifier';

import { BaselineSiteJoin } from './baseline-site-join.backend';
import { config } from 'tnp-config';
import { Helpers } from 'tnp-helpers';
import {
  HandlePrefixingFileToEasyOverride,
  HandleReferingToBaselinePathes,
  HandleReferingToAndularLibModuleName,
  HandleRefereingToNewFileOnlyAvailableInCustom,
} from './modify-ts-file-action';
import { Project } from '../../abstract';

export class FilesJoinActions {

  //#region replace in input
  replace(this: BaselineSiteJoin, input: string, relativeBaselineCustomPath: string) {
    const self = this;
    const debuggin = (config.debug.baselineSiteJoin.DEBUG_PATHES.includes(relativeBaselineCustomPath));
    if (debuggin) Helpers.log(`[replace] relativeBaselineCustomPath: ${relativeBaselineCustomPath}`)

    return {


      _1___handlePrefixingFilesToEasyOverride() {
        input = (new HandlePrefixingFileToEasyOverride(self.project as Project, debuggin))
          .action(relativeBaselineCustomPath, input);
        return input;
      },


      _2___handleReferingTOAngularLibModulesName() {
        input = (new HandleReferingToAndularLibModuleName(self.project as Project, debuggin))
          .action(relativeBaselineCustomPath, input);
        return input;
      },


      _3___handleReferingToBaselinePathes() {
        input = (new HandleReferingToBaselinePathes(self.project as Project))
          .action(relativeBaselineCustomPath, input);
        return input;
      },


      _4___handleReferingToNewFilesOnlyAvailableInCustom() {
        input = (new HandleRefereingToNewFileOnlyAvailableInCustom(self.project as Project))
          .action(relativeBaselineCustomPath, input);
        return input;
      },


    }

  }
  //#endregion
}

// export interface FilesJoinActions extends JoinMerge { }
