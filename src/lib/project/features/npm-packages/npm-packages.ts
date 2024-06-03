//#region @backend
import { _ } from 'tnp-core/src';
import { Helpers } from 'tnp-helpers/src';
import { NpmPackagesBase } from './npm-packages-base.backend';
import { resolvePacakgesFromArgs } from './npm-packages-helpers.backend';
import { config } from 'tnp-config/src';

export class NpmPackages extends NpmPackagesBase {
  public async installFromArgs(
    packagesNamesSpaceSeparated: string,
  ): Promise<void> {
    const project = this.project;
    const args = packagesNamesSpaceSeparated.split(' ').filter(a => !!a);

    if (args.length === 0) {
      await project.__npmPackages.installProcess(
        `${config.frameworkName} install`,
      );
    } else {
      const packages = resolvePacakgesFromArgs(args);
      await project.__npmPackages.installProcess(
        `${config.frameworkName} install ${packages
          .map(
            p =>
              `${p.installType}${p.version ? ` ${p.name}@${p.version}` : ''}`,
          )
          .join(', ')} `,
        { npmPackages: packages },
      );
    }
  }

  public async uninstallFromArgs(
    packagesNamesSpaceSeparated: string,
  ): Promise<void> {
    const project = this.project;
    const args = packagesNamesSpaceSeparated.split(' ').filter(a => !!a);

    if (args.length === 0) {
      Helpers.error(
        `Please specify package name: ${config.frameworkName} uninstall exapmle-npm-package `,
        false,
        true,
      );
    } else {
      const packages = resolvePacakgesFromArgs(args);
      await project.__npmPackages.installProcess(
        `${config.frameworkName} uninstall ${packages
          .map(
            p =>
              `${p.installType}${p.version ? ` ${p.name}@${p.version}` : ''}`,
          )
          .join(', ')} `,
        { npmPackages: packages, remove: true },
      );
    }
  }
}
//#endregion
