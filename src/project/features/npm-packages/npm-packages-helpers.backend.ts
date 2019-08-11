//#region imports
import chalk from 'chalk';
import * as path from 'path';
import * as fse from 'fs-extra';
import * as glob from 'glob';
import * as _ from 'lodash';

import { Project } from '../../abstract';
import { info, checkValidNpmPackageName, error, log, warn } from '../../../helpers';
import { FeatureForProject } from '../../abstract';
import { Package, InstalationTypeArr, InstalationType, LibType } from '../../../models';
import config from '../../../config';
import { PackagesRecognitionExtended } from '../packages-recognition-extended';
//#endregion


export function resolvePacakgesFromArgs(args: string[]): Package[] {
  let installType: InstalationType = '--save';
  return args
    .map(p => p.trim())
    .filter(p => {
      if (InstalationTypeArr.includes(p)) {
        installType = p as InstalationType;
        return false;
      }
      const res = checkValidNpmPackageName(p)
      if (!res) {
        error(`Invalid package to install: "${p}"`, true, true)
      }
      return res;
    })
    .map(p => {
      if (!~p.search('@')) {
        return { name: p, installType }
      }
      const isOrg = p.startsWith('@')
      const [name, version] = (isOrg ? p.slice(1) : p).split('@')
      return { name: isOrg ? `@${name}` : name, version, installType }
    })
}
