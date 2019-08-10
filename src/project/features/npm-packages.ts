//#region @backend
import chalk from 'chalk';
import * as path from 'path';
import * as fse from 'fs-extra';
import * as glob from 'glob';
import * as _ from 'lodash';

import { Project } from '../abstract';
import { info, checkValidNpmPackageName, error, log, warn } from '../../helpers';
import { FeatureForProject } from '../abstract';
import { Package, InstalationTypeArr, InstalationType, LibType } from '../../models';
import config from '../../config';
import { PackagesRecognitionExtended } from './packages-recognition-extended';

export class NpmPackages extends FeatureForProject {

  async installFromArgs(packagesNamesSpaceSeparated: string) {

    const args = packagesNamesSpaceSeparated.split(' ').filter(a => !!a);

    if (args.length === 0) {
      await this.installAll(`tnp install`);
    } else {
      const packages = this.resolvePacakgesFromArgs(args);
      await this.install(`tnp install ${packages
        .map(p => `${p.installType}${p.version ? `$@${p.version}` : ''}`)
        .join(', ')} `, packages);
    }
  }

  async uninstallFromArgs(packagesNamesSpaceSeparated: string) {

    const args = packagesNamesSpaceSeparated.split(' ').filter(a => !!a);

    if (args.length === 0) {
      error(`Please specify package name: tnp uninstall exapmle-npm-package `, false, true)
    } else {
      const packages = this.resolvePacakgesFromArgs(args);
      await this.install(`tnp uninstall ${packages
        .map(p => `${p.installType}${p.version ? `$@${p.version}` : ''}`)
        .join(', ')} `, packages, true);
    }
  }

  public async installAll(triggeredMsg: string) {
    await this.install(triggeredMsg)
  }

  public async install(triggeredMsg: string, npmPackage?: Package[], remove = false) {

    if (!_.isArray(npmPackage)) {
      npmPackage = [];
    }

    const type = this.project.type;
    const fullInstall = (npmPackage.length === 0);

    if (remove) {
      log(`Package [${
        npmPackage.map(p => p.name + (p.version ? `@${p.version}` : ''))
          .join(',')
        }] remove for ${chalk.bold(this.project.genericName)} ${triggeredMsg} `)
    } else {
      if (fullInstall) {
        log(`Packages full installation for ${this.project.genericName}`)
      } else {
        log(`Package [${
          npmPackage.map(p => p.name + (p.version ? `@${p.version}` : ''))
            .join(',')
          }] instalation for ${chalk.bold(this.project.genericName)} ${triggeredMsg} `)
        npmPackage.forEach(p => {
          this.project.packageJson.setDependencyAndSave(p, `package ${p && p.name} instalation`);
        });
      }
    }

    if (!this.emptyNodeModuls) {
      const nodeModulePath = path.join(this.project.location, config.folder.node_modules);
      if (!fse.existsSync(nodeModulePath)) {
        fse.mkdirpSync(nodeModulePath);
      }
    }

    if (this.project.isWorkspaceChildProject) {
      await this.project.parent.npmPackages.install(`workspace child: ${this.project.name} ${triggeredMsg} `, npmPackage, remove)
    }

    if (this.project.isContainer) {
      for (let index = 0; index < this.project.children.length; index++) {
        const childWrokspace = this.project.children[index];
        await childWrokspace.npmPackages.install(`from container  ${triggeredMsg} `, npmPackage, remove);
      }
    }

    if (this.project.isStandaloneProject || this.project.isWorkspace || this.project.isUnknowNpmProject) {
      if (type !== 'unknow-npm-project' && !remove) {
        this.project.packageJson.save(`${type} instalation before [${triggeredMsg}]`);
      }
      if (type === 'workspace') {
        this.project.workspaceSymlinks.remove(triggeredMsg)
      }

      if (remove) {
        npmPackage.forEach(pkg => {
          this.normalInstalation({ pkg, reason: triggeredMsg }, true);
        });
      } else {
        if (fullInstall) {
          this.normalInstalation()
        } else {
          npmPackage.forEach(pkg => {
            this.normalInstalation({ pkg, reason: triggeredMsg });
          });
        }
      }

      if (type === 'workspace') {
        this.project.workspaceSymlinks.add(triggeredMsg)
      }
      if (type !== 'unknow-npm-project') {
        this.project.packageJson.save(`${type} instalation after[${triggeredMsg}]`);
      }
      if (type === 'workspace' || this.project.isStandaloneProject) {
        // this.project.node_modules.dedupe(); /// UNCOMMENT
      }
      if (type === 'workspace') {
        this.project.tnpBundle.installAsPackage()
      }
    }

  }

  private get emptyNodeModuls() {
    return !this.project.node_modules.exist;
  }

  private get nodeModulesReplacements() {
    const npmReplacements = glob
      .sync(`${this.project.location} /${config.folder.node_modules}-*.zip`)
      .map(p => p.replace(this.project.location, '').slice(1));

    return npmReplacements;
  }

  /**
   * FIX for missing npm packages from npmjs.com
   *
   * Extract each file: node_modules-<package Name>.zip
   * to node_modules folder before instalation.
   * This will prevent packages deletion from npm
   */
  extractNodeModulesReplacements() {
    if (!this.project.isWorkspace) {
      return;
    }
    const nodeModulesPath = path.join(this.project.location, config.folder.node_modules);

    if (!fse.existsSync(nodeModulesPath)) {
      fse.mkdirpSync(nodeModulesPath)
    }
    this.nodeModulesReplacements.forEach(p => {
      const name = p.replace(`${config.folder.node_modules}-`, '');
      const moduleInNodeMdules = path.join(this.project.location, config.folder.node_modules, name);
      if (fse.existsSync(moduleInNodeMdules)) {
        info(`Extraction ${chalk.bold(name)} already exists in ` +
          ` ${chalk.bold(this.project.genericName)}/${config.folder.node_modules}`);
      } else {
        info(`Extraction before instalation ${chalk.bold(name)} in ` +
          ` ${chalk.bold(this.project.genericName)}/${config.folder.node_modules}`)

        this.project.run(`extract-zip ${p} ${nodeModulesPath}`).sync()
      }

    });
  }

  private normalInstalation(options?: { generatLockFiles?: boolean; useYarn?: boolean; pkg?: Package; reason: string; }, remove = false) {

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
          this.project.node_modules.installFrom(Project.Tnp, `Test mode instalaltion`);
        }
      } else {
        // UNCOMMENT
        // this.project.run(command,
        //   { cwd: this.project.location, output: true, biggerBuffer: true }).sync();
      }
    }

    this.extractNodeModulesReplacements();
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
