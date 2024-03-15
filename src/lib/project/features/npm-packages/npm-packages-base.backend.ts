//#region imports
import chalk from 'chalk';
import { path, _ } from 'tnp-core/src';

import { Helpers } from 'tnp-helpers/src';
import { Models } from 'tnp-models/src';
import { NpmPackagesCore } from './npm-packages-core.backend';
import { fixOptionsNpmInstall } from './npm-packages-helpers.backend';
import { PROGRESS_DATA } from 'tnp-models/src';
//#endregion

export class NpmPackagesBase extends NpmPackagesCore {

  get useSmartInstall() {

    if (this.project.isContainerCoreProject && this.project.frameworkVersionAtLeast('v2')) {
      return true;
    }

    if (this.project.isSmartContainer) {
      return true;
    }

    if (this.project.isSmartContainerChild) {
      return true;
    }

    if (this.project.isVscodeExtension) {
      return true;
    }

    if (this.project.isTnp) {
      return false;
    }

    return this.project.isStandaloneProject;
  }

  public async installProcess(triggeredMsg: string, options?: Models.npm.NpmInstallOptions) {

    if (this.project.isContainer && !this.project.isSmartContainer && !this.project.isContainerCoreProject) {
      Helpers.log(`No need for package installation in normal containter`)
      return;
    }

    if (this.project.isDocker) {
      Helpers.log(`No need for package installation for docker project`)
      return;
    }

    if (!global.globalSystemToolMode) {
      return;
    }
    if (global.tnpNonInteractive) {
      PROGRESS_DATA.log({ msg: `${this.useSmartInstall ? 'SMART ' : ''}npm instalation for "${this.project.genericName}" started..` });
    }
    options = fixOptionsNpmInstall(options, this.project);

    const fullInstall = (options.npmPackages.length === 0);

    const { remove, npmPackages } = options;
    // console.log(npmPackages)
    // process.exit(0)

    if (remove && fullInstall) {
      Helpers.error(`[install process] Please specify packages to remove`, false, true);
    }

    if (remove) {
      //#region remove
      Helpers.log(`Package [${npmPackages.map(p => p.name + (p.version ? `@${p.version}` : ''))
        .join(',')
        }] remove for ${chalk.bold(this.project.genericName)} ${triggeredMsg} `);
      npmPackages.forEach(p => {
        this.project.packageJson.removeDependencyAndSave(p, `package ${p && p.name} instalation`);
      });
      //#endregion
    } else {
      if (fullInstall) {
        Helpers.log(`Packages full installation for ${this.project.genericName}`)
      } else {
        Helpers.log(`Package [${npmPackages.map(p => p.name + (p.version ? `@${p.version}` : ''))
          .join(',')
          }] instalation for ${chalk.bold(this.project.genericName)} ${triggeredMsg} `);

        for (let index = 0; index < npmPackages.length; index++) {
          const p = npmPackages[index];
          if (!p.version) {
            p.version = 'latest';
          }
          this.project.packageJson.setDependencyAndSave(p, `package ${p && p.name} instalation`);
        }
      }
    }

    if (!this.emptyNodeModuls) {
      if (this.project.isContainer && !this.project.isContainerCoreProject) {
        this.project.node_modules.remove();
      } else {
        this.project.node_modules.recreateFolder();
      }
    }



    if (this.project.isStandaloneProject || this.project.isUnknowNpmProject || this.project.isContainer) {

      this.project.packageJson.showDeps(`${this.project.type} instalation before full insall [${triggeredMsg}]`);


      const installAllowed = (
        !this.project.isContainer
        || this.project.isSmartContainer
        || this.project.isContainerOrWorkspaceWithLinkedProjects
        || this.project.isContainerCoreProject
      );

      if (installAllowed) {
        if ((this.useSmartInstall && !options.smartInstallPreparing)
          || this.project.smartNodeModules.shouldBeReinstalled()
        ) {
          this.project.smartNodeModules.install(remove ? 'uninstall' : 'install', ...npmPackages);
        } else {
          if (fullInstall) {
            this.actualNpmProcess({ reason: triggeredMsg })
          } else {
            npmPackages.forEach(pkg => {
              this.actualNpmProcess({ pkg, reason: triggeredMsg, remove });
            });
          }
        }
      } else {
        Helpers.log(`Project is not allowed to have node_modules installed`)
      }


      if (this.project.isStandaloneProject) {
        if (!this.project.node_modules.isLink) {
          if (!this.project.node_modules.itIsSmartInstalation) {
            this.project.node_modules.dedupe();
          }
        }

        // TODO this does not apply for smartInstalation..
        // but how to check if smart installation is smart not normal ?

      }

      this.project.packageJson.save(`${this.project.type} instalation after  [${triggeredMsg}]`);
    }

    if (global.tnpNonInteractive) {
      PROGRESS_DATA.log({ msg: `npm instalation finish ok` });
    }
  }



}
