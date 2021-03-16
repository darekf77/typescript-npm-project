//#region @backend
import * as _ from 'lodash';
import { Helpers } from 'tnp-helpers';
import { NpmPackagesBase } from './npm-packages-base.backend';
import { resolvePacakgesFromArgs } from './npm-packages-helpers.backend';
import { config } from 'tnp-config';

export class NpmPackages extends NpmPackagesBase {

  public async installFromArgs(packagesNamesSpaceSeparated: string, smoothInstall = false, smartInstallPreparing = false) {
    const project = this.project;
    const args = packagesNamesSpaceSeparated.split(' ').filter(a => !!a);

    if (args.length === 0) {
      await project.npmPackages.installProcess(`tnp install`, { smoothInstall, smartInstallPreparing });
    } else {
      const packages = resolvePacakgesFromArgs(args);
      await project.npmPackages.installProcess(`tnp install ${packages
        .map(p => `${p.installType}${p.version ? ` ${p.name}@${p.version}` : ''}`)
        .join(', ')} `, { npmPackages: packages, smoothInstall, smartInstallPreparing });
    }
  }

  public async uninstallFromArgs(packagesNamesSpaceSeparated: string) {
    const project = this.project;
    const args = packagesNamesSpaceSeparated.split(' ').filter(a => !!a);

    if (args.length === 0) {
      Helpers.error(`Please specify package name: ${config.frameworkName} uninstall exapmle-npm-package `, false, true)
    } else {
      const packages = resolvePacakgesFromArgs(args);
      await project.npmPackages.installProcess(`${config.frameworkName} uninstall ${packages
        .map(p => `${p.installType}${p.version ? ` ${p.name}@${p.version}` : ''}`)
        .join(', ')} `, { npmPackages: packages, remove: true });
    }
  }

}
//#endregion
