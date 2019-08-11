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
import { NpmPackagesCore } from './npm-packages-core.backend';
//#endregion


export class NpmPackagesBase extends NpmPackagesCore {

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
          this.actualNpmProcess({ pkg, reason: triggeredMsg }, true);
        });
      } else {
        if (fullInstall) {
          this.actualNpmProcess()
        } else {
          npmPackage.forEach(pkg => {
            this.actualNpmProcess({ pkg, reason: triggeredMsg });
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


}
