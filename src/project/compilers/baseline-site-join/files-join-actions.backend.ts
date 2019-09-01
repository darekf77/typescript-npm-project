//#region imports
import * as fs from 'fs';
import * as _ from 'lodash';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as glob from 'glob';
import * as watch from 'watch'
import * as rimraf from 'rimraf';
// local
import { SourceModifier } from '../source-modifier';
import { DEBUG_PATHES, DEBUG_MERGE_PATHES } from './bsj-debug.backend';

import { JoinMerge } from './join-merge.backend';
import { REGEXS } from './bsj-regexes.backend';
import { HelpersMerge } from './merge-helpers.backend';

export class FilesJoinActions {

  //#region replace in input
  replace(this: JoinMerge, input: string, relativeBaselineCustomPath: string) {
    const self = this;
    const debuggin = (DEBUG_PATHES.includes(relativeBaselineCustomPath));
    if (debuggin) console.log(`relativeBaselineCustomPath: ${relativeBaselineCustomPath}`)

    return {

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
      _1___handlePrefixingFilesToEasyOverride() {

        const baselineFilePathNoExit = HelpersMerge.PathHelper.removeExtension(relativeBaselineCustomPath);
        if (debuggin) console.log(`baselineFilePathNoExit: ${baselineFilePathNoExit}`)

        const toReplaceImportPath =
          HelpersMerge.getRegexSourceString(
            `${path.join(HelpersMerge.pathToBaselineNodeModulesRelative(this.project)
              .replace(/\//g, '//'),
              baselineFilePathNoExit)}`
          )

        const replacement = `./${HelpersMerge.getPrefixedBasename(baselineFilePathNoExit)}`;

        // if (debuggin) console.log(`toReplaceImportPath: ${toReplaceImportPath}`)
        if (debuggin) console.log(`replacement: ${replacement}`)

        const replaceRegex = new RegExp(`(\"|\')${toReplaceImportPath}(\"|\')`, 'g')

        if (debuggin) {
          console.log(`replaceRegex: ${replaceRegex.source}`)
        }

        input = input.replace(replaceRegex, `'${replacement}'`);
        // if (debuggin) console.log(`
        // result input:
        // ${input}


        // `)

        return input;
      },

      /**
       * FIST PROBLEM:
       * Handle situation when in site you are refering to angular-lib baseline module
       * ex:
       * import { Helpers } from 'angular-lib-name/(components/module/browser/dist)/helpers-path'
       *                                                        <- will be repaled do browser ->
       *
       * SECOND PROBLEM:
       * Handle situation when in site you are refering to angular-lib baseline module
       * ex:
       * import { Helpers } from 'baseline-name/angular-lib-name/(components/module/browser/dist)/helpers-path'
       *                                                        <- will be repaled do browser ->
       */
      _2___handleReferingTOAngularLibModulesName() {
        // console.log(`relativeBaselineCustomPath: "${relativeBaselineCustomPath}"`)
        if (self.project.isWorkspaceChildProject) {
          input = SourceModifier.PreventNotUseOfTsSourceFolders(self.project, relativeBaselineCustomPath, input);
        }
        return input;
      },

      /**
       * Same thing like in currentFilePath() but:
       *  - handle situation like in Problem1;
       *  - handle situation when in your custom files you are referening to custom files
       */
      _3___handleReferingToBaselinePathes() {

        const debuggin = (DEBUG_PATHES.includes(relativeBaselineCustomPath));

        if (debuggin) console.log(`

        relativeBaselineCustomPath:${relativeBaselineCustomPath}


        `)
        const levelBack = relativeBaselineCustomPath.split('/').length - 3;
        const levelBackPath = _.times(levelBack, () => '../').join('').replace(/\/$/g, '');
        if (debuggin) console.log(`Level back for ${relativeBaselineCustomPath} is ${levelBack} ${levelBackPath}`)
        const tmpPathToBaselineNodeModulesRelative = HelpersMerge
          .getRegexSourceString(HelpersMerge.pathToBaselineNodeModulesRelative(self.project))
        const pathPart = REGEXS.baselinePart;
        if (debuggin) console.log('pathPart', pathPart)
        const baselineRegex = `${tmpPathToBaselineNodeModulesRelative}${pathPart}*`
        if (debuggin) console.log(`\nbaselineRegex: ${baselineRegex}`)
        let patterns = input.match(new RegExp(baselineRegex, 'g'))


        if (debuggin) console.log(`[baselinepath] recognized patterns\n`, _.isArray(patterns) && patterns.map(d => `\t${d}`).join('\n'))


        if (Array.isArray(patterns) && patterns.length >= 1) {
          patterns.forEach(pathToReplaceInInput => {

            if (debuggin) console.log(`PATTERN IN INPUT ${pathToReplaceInInput}`)
            if (debuggin) console.log(`BASELINE: ${HelpersMerge.pathToBaselineNodeModulesRelative(self.project)}`);
            let patternWithoutBaselinePart = pathToReplaceInInput
              .replace(HelpersMerge.pathToBaselineNodeModulesRelative(self.project), '')
            if (debuggin) console.log(`PATTERN WITHOUT BASELINE:${patternWithoutBaselinePart}`)
            if (debuggin) console.log(`pathPart = ${pathPart}`)

            patternWithoutBaselinePart = patternWithoutBaselinePart
              .replace(new RegExp(`^${pathPart}`, 'g'), '')

            if (debuggin) console.log('PATTERN WITHOUT BASELINE no path part', patternWithoutBaselinePart)
            const toReplace = `${levelBackPath}${patternWithoutBaselinePart}`
            if (debuggin) console.log(`toReplace:${toReplace}`)
            input = input.replace(pathToReplaceInInput, `.${toReplace}`.replace('...', '..'))
          })
        }
        return input;
      },

      /**
       * Prefixed replacement
       *
       * Example:
       *
       * Files:
       * - site: custom/src/example/totaly-new-file.ts
       * - site:  src/app.ts => is refereing to 'totaly-new-file.ts' which is new file only available in site/custom
       */
      _4___handleReferingToNewFilesOnlyAvailableInCustom() {
        HelpersMerge.relativePathesCustom(self.project).forEach(relativePthInCustom => {
          if (relativePthInCustom !== relativeBaselineCustomPath) {
            let baselineFilePathNoExit = HelpersMerge.PathHelper.removeExtension(relativePthInCustom);

            const pathToSiteeFile = path.join(self.project.location, baselineFilePathNoExit)
            const pathToBaselineFile = path.join(HelpersMerge.pathToBaselineAbsolute(self.project), baselineFilePathNoExit)

            if (fse.existsSync(pathToBaselineFile) && !fse.existsSync(pathToSiteeFile)) {
              let toReplace = HelpersMerge.getPrefixedBasename(baselineFilePathNoExit);

              baselineFilePathNoExit = HelpersMerge.getRegexSourceString(baselineFilePathNoExit);
              baselineFilePathNoExit = `\.${HelpersMerge.PathHelper.removeRootFolder(baselineFilePathNoExit)}`
              const dirPath = path.dirname(relativePthInCustom);
              toReplace = HelpersMerge.PathHelper.removeRootFolder(path.join(dirPath, toReplace))
              toReplace = `.${toReplace}`
              // console.log(`Replace: ${baselineFilePathNoExit} on this: ${toReplace}`)
              input = input.replace(new RegExp(baselineFilePathNoExit, 'g'), toReplace)
            }
          }
        });
        return input;
      },


    }

  }
  //#endregion
}

// export interface FilesJoinActions extends JoinMerge { }
