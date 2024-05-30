import { config } from 'tnp-config/src';
import { crossPlatformPath, fse, path } from 'tnp-core/src';
import { Helpers } from 'tnp-helpers/src';
import { BaseFeatureForProject } from 'tnp-helpers/src';
import { Project } from '../abstract/project';

const assetsFor = `${config.folder.assets}-for`;

export class AssetsManager extends BaseFeatureForProject<Project> {
  copyExternalAssets(outDir: 'dist', websql: boolean) {
    this.project.__isomorphicPackages
      .filter(f => !f.startsWith('@'))
      .map(pkgName => {
        const sharedPath = this.project.__node_modules.pathFor(
          crossPlatformPath([
            pkgName,
            config.folder.assets,
            config.folder.shared,
          ]),
        );

        if (Helpers.exists(sharedPath)) {
          const destinations = [
            crossPlatformPath([
              this.project.location,
              `tmp-src-${outDir}${websql ? '-websql' : ''}`,
              config.folder.assets,
              assetsFor,
              path.basename(pkgName),
              config.folder.shared,
            ]),

            crossPlatformPath([
              this.project.location,
              `tmp-src-app-${outDir}${websql ? '-websql' : ''}`,
              config.folder.assets,
              assetsFor,
              path.basename(pkgName),
              config.folder.shared,
            ]),

            crossPlatformPath([
              this.project.location,
              `tmp-source-${outDir}${websql ? '-websql' : ''}`,
              config.folder.assets,
              assetsFor,
              path.basename(pkgName),
              config.folder.shared,
            ]),
          ];
          for (let index = 0; index < destinations.length; index++) {
            const dest = destinations[index];
            Helpers.removeFolderIfExists(dest);
            Helpers.copy(sharedPath, dest, { recursive: true });
          }
        }
      });
    this.project.__isomorphicPackages
      .filter(f => f.startsWith('@'))
      .map(orgPkgName => {
        const orgName = path.dirname(orgPkgName).replace('@', '');
        const realPathOrg = this.project.__node_modules.pathFor(
          crossPlatformPath(path.dirname(orgPkgName)),
        );

        if (Helpers.exists(realPathOrg)) {
          const sharedPath = crossPlatformPath([
            fse.realpathSync(realPathOrg),
            path.basename(orgPkgName),
            config.folder.assets,
            config.folder.shared,
          ]);

          if (Helpers.exists(sharedPath)) {
            const destinations = [
              crossPlatformPath([
                this.project.location,
                `tmp-src-${outDir}${websql ? '-websql' : ''}`,
                config.folder.assets,
                assetsFor,
                `${orgName}--${path.basename(orgPkgName)}`,
                config.folder.shared,
              ]),

              crossPlatformPath([
                this.project.location,
                `tmp-src-app-${outDir}${websql ? '-websql' : ''}`,
                config.folder.assets,
                assetsFor,
                `${orgName}--${path.basename(orgPkgName)}`,
                config.folder.shared,
              ]),

              crossPlatformPath([
                this.project.location,
                `tmp-source-${outDir}${websql ? '-websql' : ''}`,
                config.folder.assets,
                assetsFor,
                `${orgName}--${path.basename(orgPkgName)}`,
                config.folder.shared,
              ]),
            ];
            for (let index = 0; index < destinations.length; index++) {
              const dest = destinations[index];
              Helpers.removeFolderIfExists(dest);
              Helpers.copy(sharedPath, dest, { recursive: true });
            }
          }
        }
      });
  }
}
