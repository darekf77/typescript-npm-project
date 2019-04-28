//#region @backend
import chalk from 'chalk';
import * as path from 'path';
import fse from 'fs-extra';

import { Project } from '../abstract';
import { info, checkValidNpmPackageName, error, log, warn } from '../../helpers';
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
      this.install(`tnp install ${packages.join(',')}`, ...packages);
    }
  }


  public installAll(triggeredBy: string) {

    const triggeredMsg = ` [triggered by "${triggeredBy}"] `;
    log(`Packages instalation for ${this.project.genericName} ${triggeredMsg}`)

    if (this.project.node_modules.exist) {
      log(`[npm-package] node_modules exisit for ${this.project.genericName}`)
      return;
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
      return;
    }

    if (this.project.isStandaloneProject) {
      this.project.node_modules.installFrom(Project.Tnp, triggeredMsg)
      this.project.packageJson.show(`standalone instalation from tnp ${triggeredMsg}`)
      return;
    }

    if (this.project.isContainer) {
      this.project.node_modules.installFrom(Project.Tnp, triggeredMsg);
      this.project.children.forEach(childWorkspace => {
        childWorkspace.node_modules.remove()
        childWorkspace.node_modules.installFrom(this.project, `parent container ${this.project.name} ${triggeredMsg}`)
      });
      this.project.packageJson.show(`container instalation from tnp ${triggeredMsg}`)
      return;
    }

    if (this.project.isWorkspace) {
      this.project.workspaceSymlinks.remove(triggeredMsg)
      if (this.project.isContainerChild) {
        this.project.parent.npmPackages.installAll(`container child:  ${this.project.name} ${triggeredMsg}`)
      } else {
        this.project.node_modules.installFrom(Project.Tnp, triggeredMsg)
        this.project.packageJson.show('workspace instalation from tnp')
      }
      this.project.workspaceSymlinks.add(triggeredMsg)
      return;
    }

  }


  public install(triggeredMsg: string, ...npmPackage: Package[]) {
    log(`Package [${npmPackage.join(',')}] instalation for ${this.project.genericName} ${triggeredMsg}`)

    if (!this.emptyNodeModuls) {
      const nodeModulePath = path.join(this.project.location, config.folder.node_modules);
      if (!fse.existsSync(nodeModulePath)) {
        fse.mkdirpSync(nodeModulePath);
      }
    }

    const type = this.project.type;
    if (type === 'unknow-npm-project' || this.project.isTnp) {
      npmPackage.forEach(pkg => {
        this.normalInstalation({ pkg })
      });
      return;
    }

    if (this.project.isStandaloneProject || this.project.isContainer) {
      Project.Tnp.packageJson.show(`${type} instalation - from tnp ${triggeredMsg}`);
      this.project.packageJson.show(`${type} instalation - before normal install ${triggeredMsg}`)
      npmPackage.forEach(pkg => {
        this.normalInstalation({ pkg })
      });
      this.project.packageJson.show(`${type} instalation - after normal insllation to generate override ${triggeredMsg}`);
      if (this.project.isContainer) {
        this.project.children.forEach(workspaceContainerChild => {
          workspaceContainerChild.packageJson.hide(`becouse it is container child: ${this.project.name} ${triggeredMsg}`)
          npmPackage.forEach(pkg => {
            this.project.node_modules.copy(pkg.name, { override: true }).to(workspaceContainerChild);
          });
          workspaceContainerChild.getDepsAsPackage('tnp_overrided_dependencies').forEach(p => {
            warn(`${type} instalation, overrided package "${p.name}" ` +
              `in workspace ${workspaceContainerChild.genericName} will be ingnore.`)
          });
        });
      }
      return;
    }

    if (this.project.isWorkspaceChildProject) {
      this.project.parent.npmPackages.install(`workspace child: ${this.project.name} ${triggeredMsg}`, ...npmPackage)
      return;
    }

    if (this.project.isWorkspace) {
      if (this.project.isContainerChild) {
        this.project.parent.npmPackages.install(`container child: ${this.project.name} ${triggeredMsg}`, ...npmPackage)
        return;
      }
      Project.Tnp.packageJson.show(`${type} instalation - from tnp ${triggeredMsg}`);
      this.project.packageJson.show(`${type} instalation - before normal install ${triggeredMsg}`)
      npmPackage.forEach(pkg => {
        this.normalInstalation({ pkg })
      });
      this.project.packageJson.show(`${type} instalation - after normal insllation to generate override ${triggeredMsg}`);
    }


  }



  private get emptyNodeModuls() {
    return !this.project.node_modules.exist;
  }

  private normalInstalation(options?: { generatLockFiles?: boolean; useYarn?: boolean; pkg?: Package; }) {
    const { generatLockFiles = false, useYarn = false, pkg = void 0 } = options || {};
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
          fse.existsSync(yarnLockPath) && fse.removeSync(yarnLockPath);
        }
      } else {
        const packageLockPath = path.join(this.project.location, config.file.package_lock_json)
        fse.existsSync(packageLockPath) && fse.removeSync(packageLockPath);
      }
    }
    this.project.packageJson.dedupe();
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
