//#region imports
import chalk from 'chalk';
import * as _ from 'lodash';

import { error, log } from '../../../helpers';
import { NpmInstallOptions } from '../../../models';
import { NpmPackagesCore } from './npm-packages-core.backend';
import { fixOptionsNpmInstall } from './npm-packages-helpers.backend';
import { PROGRESS_DATA } from '../../../progress-output';
//#endregion


export class NpmPackagesBase extends NpmPackagesCore {

  public async installProcess(triggeredMsg: string, options?: NpmInstallOptions) {
    if (!global.tnp_normal_mode) {
      return;
    }
    if (global.tnpNonInteractive) {
      PROGRESS_DATA.log({ msg: `npm instalation for "${this.project.genericName}" started..` });
    }
    const { remove, npmPackage, smoothInstall } = fixOptionsNpmInstall(options, this.project);
    const fullInstall = (npmPackage.length === 0);

    if (remove && fullInstall) {
      error(`[install process]] Please specify packages to remove`, false, true);
    }

    if (remove) {
      log(`Package [${
        npmPackage.map(p => p.name + (p.version ? `@${p.version}` : ''))
          .join(',')
        }] remove for ${chalk.bold(this.project.genericName)} ${triggeredMsg} `);
      npmPackage.forEach(p => {
        this.project.packageJson.removeDependencyAndSave(p, `package ${p && p.name} instalation`);
      });
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
      if (this.project.isContainer) {
        this.project.node_modules.remove();
      } else {
        this.project.node_modules.recreateFolder();
      }
    }

    if (this.project.isWorkspaceChildProject) {
      await this.project.parent.npmPackages.installProcess(`workspace child: ${this.project.name} ${triggeredMsg} `, options)
    }

    if (this.project.isStandaloneProject || this.project.isWorkspace || this.project.isUnknowNpmProject || this.project.isContainer) {

      this.project.packageJson.showDeps(`${this.project.type} instalation before full insall [${triggeredMsg}]`);

      if (this.project.isWorkspace && smoothInstall === false) {
        this.project.workspaceSymlinks.remove(triggeredMsg)
      }

      if (!this.project.isContainer) {
        if (fullInstall) {
          this.actualNpmProcess({ reason: triggeredMsg })
        } else {
          npmPackage.forEach(pkg => {
            this.actualNpmProcess({ pkg, reason: triggeredMsg, remove, smoothInstall });
          });
        }
      } else {
        log(`Dont install node_modules - project is container`)
      }

      if (this.project.isWorkspace && smoothInstall === false) {
        this.project.workspaceSymlinks.add(triggeredMsg)
      }
      if (this.project.isContainerChild) {
        this.project.packageJson.hideDeps(`${this.project.type} hide deps for container child [${triggeredMsg}]`);
      }
      if (this.project.isWorkspace || this.project.isStandaloneProject) {
        this.project.node_modules.dedupe();
      }
      if (this.project.isWorkspace && smoothInstall === false) {
        this.project.tnpBundle.installAsPackage();
      }
      this.project.packageJson.save(`${this.project.type} instalation after  [${triggeredMsg}]`);
    }
    if (global.tnpNonInteractive) {
      PROGRESS_DATA.log({ msg: `npm instalation finish ok` });
    }
  }
}



