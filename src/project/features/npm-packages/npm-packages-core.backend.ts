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


export class NpmPackagesCore extends FeatureForProject {

  protected get emptyNodeModuls() {
    return !this.project.node_modules.exist;
  }

  protected actualNpmProcess(options?:
    { generatLockFiles?: boolean; useYarn?: boolean; pkg?: Package; reason: string; },
    remove = false) {

    const { generatLockFiles = false, useYarn = false, pkg = void 0, reason = '' } = options || {};
    const yarnLockPath = path.join(this.project.location, config.file.yarn_lock);
    const yarnLockExisits = fse.existsSync(yarnLockPath);
    const install = (remove ? 'uninstall' : 'install');


    let command: string;
    if (useYarn) {
      command = `yarn ${pkg ? 'add' : install} --ignore-engines ${pkg ? pkg.name : ''} `
        + `${(pkg && pkg.installType && pkg.installType === '--save-dev') ? '-dev' : ''}`;
    } else {
      command = `npm ${install} ${pkg ? pkg.name : ''} ${(pkg && pkg.installType) ? pkg.installType : ''}`;
    }


    if (remove) {
      this.project.packageJson.removeDependency(pkg, reason);
      // UNCOMMENT
      // this.project.run(command,
      //   { cwd: this.project.location, output: true, biggerBuffer: true }).sync();
    } else {
      if (global.testMode) {
        log(`Test mode: normal instalation`)
        if (pkg) {
          Project.Tnp.node_modules.copy(pkg).to(this.project);
        } else {
          this.project.node_modules.copyFrom(Project.Tnp, `Test mode instalaltion`);
        }
      } else {
        // UNCOMMENT
        // this.project.run(command,
        //   { cwd: this.project.location, output: true, biggerBuffer: true }).sync();
      }
    }

    this.project.quickFixes.nodeModulesPackagesZipReplacement();
    PackagesRecognitionExtended.fromProject(this.project).start(true);

    if (!generatLockFiles) {
      if (useYarn) {
        if (yarnLockExisits) {
          if (this.project.git.isGitRepo) {
            this.project.git.resetFiles(config.file.yarn_lock);
          }
        } else {
          fse.existsSync(yarnLockPath) && fse.unlinkSync(yarnLockPath);
        }
      } else {
        const packageLockPath = path.join(this.project.location, config.file.package_lock_json)
        fse.existsSync(packageLockPath) && fse.unlinkSync(packageLockPath);
      }
    }
  }



}
