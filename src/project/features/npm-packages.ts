//#region @backend
import chalk from 'chalk';
import * as path from 'path';
import fse from 'fs-extra';

import { Project } from '../abstract';
import { info, checkValidNpmPackageName, error, log } from '../../helpers';
import { FeatureForProject } from '../abstract';
import { Package, InstalationTypeArr, InstalationType, LibType } from '../../models';
import config from '../../config';

export class NpmPackages extends FeatureForProject {

  fromArgs(packagesNamesSpaceSeparated: string) {

    const args = packagesNamesSpaceSeparated.split(' ').filter(a => !!a);

    if (args.length === 0) {
      this.installAll(`tnp install`);
    } else {
      const packages = this.resolvePacakgesFromArgs(args);
      this.install(...packages);
    }
  }


  public installAll(triggeredBy: string) {

    const triggeredMsg = ` [triggered by "${triggeredBy}"] `;
    log(`Packages instalation for ${this.project.genericName} ${triggeredMsg}`)

    if (this.project.node_modules.exist) {
      log(`[npm-package] node_modules exisit for ${this.project.genericName}`)
      return
    }

    const type = this.project.type;

    if (type === 'unknow-npm-project' || this.project.isTnp) {
      if (this.emptyNodeModuls) {
        this.normalInstalation()
      }
      return;
    }

    if (this.project.isWorkspaceChildProject) {
      this.project.parent.npmPackages.installAll(`workspace child: ${this.project.name} ${triggeredMsg}`)
      return
    }

    if (this.project.isStandaloneProject) {
      this.project.packageJson.show(`standalone instalation from tnp ${triggeredMsg}`)
      this.project.node_modules.installFrom(Project.Tnp, triggeredMsg)
      return
    }

    if (this.project.isContainer) {
      this.project.packageJson.show(`container instalation from tnp ${triggeredMsg}`)
      this.project.node_modules.installFrom(Project.Tnp, triggeredMsg)
      this.project.children.forEach(childWorkspace => {
        childWorkspace.node_modules.remove()
        childWorkspace.npmPackages.installAll(`parent container ${this.project.name} ${triggeredMsg}`)
      })
      return
    }

    if (this.project.isWorkspace) {
      this.project.workspaceSymlinks.remove(triggeredMsg)
      if (this.project.isContainerChild) {
        this.project.parent.npmPackages.installAll(`container child:  ${this.project.name} ${triggeredMsg}`)
        this.project.node_modules.installFrom(this.project.parent, triggeredMsg)
      } else {
        this.project.packageJson.show('workspace instalation from tnp')
        this.project.node_modules.installFrom(Project.Tnp, triggeredMsg)
      }
      this.project.workspaceSymlinks.add(triggeredMsg)
      return
    }

  }



  private get emptyNodeModuls() {
    return !this.project.node_modules.exist
  }

  private normalInstalation(options?: { generatLockFiles: boolean; useYarn: boolean; }) {
    const { generatLockFiles = false, useYarn = false } = options || {};
    const yarnLockPath = path.join(this.project.location, config.file.yarn_lock);
    const yarnLockExisits = fse.existsSync(yarnLockPath);

    let command: string;
    if (useYarn) {
      command = 'yarn install --ignore-engines'
    } else {
      command = 'npm install'
    }
    this.project.run(command,
      { cwd: this.project.location, output: true, biggerBuffer: true }).sync()
    if (!generatLockFiles) {
      if (useYarn) {
        if (yarnLockExisits) {
          if (this.project.git.isGitRepo) {
            this.project.git.resetFiles(config.file.yarn_lock)
          }
        } else {
          fse.existsSync(yarnLockPath) && fse.removeSync(yarnLockPath)
        }
      } else {
        const packageLockPath = path.join(this.project.location, config.file.package_lock_json)
        fse.existsSync(packageLockPath) && fse.removeSync(packageLockPath)
      }
    }

  }

  public install(...npmPackage: Package[]) {

  }

  private resolvePacakgesFromArgs(args: string[]): Package[] {
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


}

//#endregion
