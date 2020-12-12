import * as fs from 'fs';
import * as _ from 'lodash';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as glob from 'glob';
import * as watch from 'watch'

import { ModifyTsFileActionBase } from './modify-ts-file-action-base.backend';
import { Helpers } from 'tnp-helpers';
import { HelpersMerge } from 'tnp-helpers';
import { config } from 'tnp-config';
import { Project } from '../../../index';

/**
 * Prefixed replacement
 *
 * Example:
 *
 * Files:
 * - site: custom/src/example/totaly-new-file.ts
 * - site:  src/app.ts => is refereing to 'totaly-new-file.ts' which is new file only available in site/custom
 */
export class HandleRefereingToNewFileOnlyAvailableInCustom extends ModifyTsFileActionBase {

  constructor(public project: Project) {
    super()
  }

  action(relativeBaselineCustomPath, input) {
    HelpersMerge.relativePathesCustom(this.project).forEach(relativePthInCustom => {
      if (relativePthInCustom !== relativeBaselineCustomPath) {
        let baselineFilePathNoExit = Helpers.path.removeExtension(relativePthInCustom);

        const pathToSiteeFile = path.join(this.project.location, baselineFilePathNoExit)
        const pathToBaselineFile = path.join(HelpersMerge.pathToBaselineAbsolute(this.project), baselineFilePathNoExit)

        if (fse.existsSync(pathToBaselineFile) && !fse.existsSync(pathToSiteeFile)) {
          let toReplace = HelpersMerge.getPrefixedBasename(baselineFilePathNoExit);

          baselineFilePathNoExit = Helpers.escapeStringForRegEx(baselineFilePathNoExit);
          baselineFilePathNoExit = `\.${Helpers.path.removeRootFolder(baselineFilePathNoExit)}`
          const dirPath = path.dirname(relativePthInCustom);
          toReplace = Helpers.path.removeRootFolder(path.join(dirPath, toReplace))
          toReplace = `.${toReplace}`
          // Helpers.log(`Replace: ${baselineFilePathNoExit} on self: ${toReplace}`)
          input = input.replace(new RegExp(baselineFilePathNoExit, 'g'), toReplace)
        }
      }
    });
    return input;
  }
}
