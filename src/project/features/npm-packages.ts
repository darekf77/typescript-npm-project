//#region @backend
import chalk from 'chalk';
import * as path from 'path';
import * as fse from 'fs-extra';

import { Project } from '../abstract';
import { info, checkValidNpmPackageName, error, log, warn } from '../../helpers';
import { FeatureForProject } from '../abstract';
import { Package, InstalationTypeArr, InstalationType, LibType } from '../../models';
import config from '../../config';

export class NpmPackages extends FeatureForProject {

  async fromArgs(packagesNamesSpaceSeparated: string) {

    const args = packagesNamesSpaceSeparated.split(' ').filter(a => !!a);

    if (args.length === 0) {
      await this.installAll(`tnp install`);
    } else {
      const packages = this.resolvePacakgesFromArgs(args);
      await this.install(`tnp install ${packages.join(',')}`, ...packages);
    }
  }

  public async installAll(triggeredMsg: string) {
    await this.install(triggeredMsg)
  }

  public async install(triggeredMsg: string, ...npmPackage: Package[]) {

    const type = this.project.type;
    const fullInstall = (npmPackage.length === 0);

    if (fullInstall) {
      log(`Packages full installation for ${this.project.genericName}`)
    } else {
      log(`Package [${npmPackage.map(p => p.name + (p.version ? `@${p.version}` : ''))
        .join(',')}] instalation for ${this.project.genericName} ${triggeredMsg}`)

    }

    if (!this.emptyNodeModuls) {
      const nodeModulePath = path.join(this.project.location, config.folder.node_modules);
      if (!fse.existsSync(nodeModulePath)) {
        fse.mkdirpSync(nodeModulePath);
      }
    }

    if (this.project.isWorkspaceChildProject) {
      await this.project.parent.npmPackages.install(`workspace child: ${this.project.name} ${triggeredMsg}`, ...npmPackage)
    }

    if (this.project.isContainer) {
      for (let index = 0; index < this.project.children.length; index++) {
        const childWrokspace = this.project.children[index];
        await childWrokspace.npmPackages.install(`from container  ${triggeredMsg}`, ...npmPackage);
      }
    }

    if (this.project.isStandaloneProject || this.project.isWorkspace || type === 'unknow-npm-project') {
      if (type !== 'unknow-npm-project') {
        this.project.packageJson.show(`${type} instalation before [${triggeredMsg}]`);
      }
      if (type === 'workspace') {
        this.project.workspaceSymlinks.remove(triggeredMsg)
      }
      if (fullInstall) {
        this.normalInstalation()
      } else {
        npmPackage.forEach(pkg => {
          this.normalInstalation({ pkg })
        });
      }
      if (type === 'workspace') {
        this.project.workspaceSymlinks.add(triggeredMsg)
      }
      if (type !== 'unknow-npm-project') {
        this.project.packageJson.show(`${type} instalation after [${triggeredMsg}]`);
      }
      this.project.packageJson.dedupe();
      this.project.tnpBundle.installAsPackage()
    }

  }



  private get emptyNodeModuls() {
    return !this.project.node_modules.exist;
  }

  private normalInstalation(options?: { generatLockFiles?: boolean; useYarn?: boolean; pkg?: Package; }) {
    const { generatLockFiles = false, useYarn = true, pkg = void 0 } = options || {};
    const yarnLockPath = path.join(this.project.location, config.file.yarn_lock);
    const yarnLockExisits = fse.existsSync(yarnLockPath);

    let command: string;
    if (useYarn) {
      command = `yarn ${pkg ? 'add' : 'install'} --ignore-engines ${pkg ? pkg.name : ''} `
        + `${(pkg && pkg.installType && pkg.installType === '--save-dev') ? '-dev' : ''}`;
    } else {
      command = `npm install ${pkg ? pkg.name : ''} ${(pkg && pkg.installType) ? pkg.installType : ''}`;
    }
    this.project.run(command,
      { cwd: this.project.location, output: true, biggerBuffer: true }).sync();
    if (!generatLockFiles) {
      if (useYarn) {
        if (yarnLockExisits) {
          if (this.project.git.isGitRepo) {
            this.project.git.resetFiles(config.file.yarn_lock)
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
