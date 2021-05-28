//#region imports
import chalk from 'chalk';
import { _ } from 'tnp-core';

import { Helpers } from 'tnp-helpers';
import { Models } from 'tnp-models';
import { NpmPackagesCore } from './npm-packages-core.backend';
import { fixOptionsNpmInstall } from './npm-packages-helpers.backend';
import { PROGRESS_DATA } from 'tnp-models';
//#endregion

export class NpmPackagesBase extends NpmPackagesCore {

  get useSmartInstall() {
    if (this.project.isTnp) {
      return false;
    }
    return (this.project.isStandaloneProject
      || this.project.isWorkspace
      || this.project.isWorkspaceChildProject)
  }

  public async installProcess(triggeredMsg: string, options?: Models.npm.NpmInstallOptions) {
    if (!global.globalSystemToolMode) {
      return;
    }
    if (global.tnpNonInteractive) {
      PROGRESS_DATA.log({ msg: `${this.useSmartInstall ? 'SMART ' : ''}npm instalation for "${this.project.genericName}" started..` });
    }
    options = fixOptionsNpmInstall(options, this.project);

    const fullInstall = (options.npmPackages.length === 0);
    if (fullInstall && this.project.isVscodeExtension && !this.project.isCoreProject) {
      options.smoothInstall = true;
    }
    const { remove, npmPackages, smoothInstall } = options;
    // console.log(npmPackages)
    // process.exit(0)

    if (remove && fullInstall) {
      Helpers.error(`[install process] Please specify packages to remove`, false, true);
    }

    if (remove) {
      Helpers.log(`Package [${npmPackages.map(p => p.name + (p.version ? `@${p.version}` : ''))
        .join(',')
        }] remove for ${chalk.bold(this.project.genericName)} ${triggeredMsg} `);
      npmPackages.forEach(p => {
        this.project.packageJson.removeDependencyAndSave(p, `package ${p && p.name} instalation`);
      });
    } else {
      if (fullInstall) {
        Helpers.log(`Packages full installation for ${this.project.genericName}`)
      } else {
        Helpers.log(`Package [${npmPackages.map(p => p.name + (p.version ? `@${p.version}` : ''))
          .join(',')
          }] instalation for ${chalk.bold(this.project.genericName)} ${triggeredMsg} `)
        npmPackages.forEach(p => {
          this.project.packageJson.setDependencyAndSave(p, `package ${p && p.name} instalation`);
        });
      }
    }

    if (!this.emptyNodeModuls) {
      if (this.project.isContainer && !this.project.isContainerCoreProject) {
        this.project.node_modules.remove();
      } else {
        this.project.node_modules.recreateFolder();
      }
    }

    if (this.project.isWorkspaceChildProject) {
      await this.project.parent.npmPackages.installProcess(`workspace child: ${this.project.name} ${triggeredMsg} `, options)
    }

    if (this.project.isStandaloneProject || this.project.isWorkspace || this.project.isUnknowNpmProject || this.project.isContainer) {

      this.project.packageJson.showDeps(`${this.project._type} instalation before full insall [${triggeredMsg}]`);

      if (this.project.isWorkspace && smoothInstall === false) {
        this.project.workspaceSymlinks.remove(triggeredMsg)
      }

      const installAllowed = (!this.project.isContainer || this.project.isContainerWithLinkedProjects || this.project.isContainerCoreProject);

      if (installAllowed) {
        if (this.useSmartInstall
          || (this.project.isContainerCoreProject && this.project.frameworkVersionAtLeast('v2')) && !options.smartInstallPreparing) {
          this.project.smartNodeModules.install(remove ? 'uninstall' : 'install', ...npmPackages);
        } else {
          if (fullInstall) {
            this.actualNpmProcess({ reason: triggeredMsg, smoothInstall })
          } else {
            npmPackages.forEach(pkg => {
              this.actualNpmProcess({ pkg, reason: triggeredMsg, remove, smoothInstall });
            });
          }
        }
      } else {
        Helpers.log(`Dont install node_modules - project is container`)
      }

      if (this.project.isWorkspace && smoothInstall === false) {
        this.project.workspaceSymlinks.add(triggeredMsg)
      }
      if (this.project.isContainerChild && this.project.isWorkspace) {
        this.project.packageJson.hideDeps(`${this.project._type} hide deps for container child [${triggeredMsg}]`);
      }
      if ((this.project.isWorkspace || this.project.isStandaloneProject) && smoothInstall === false) {
        if (!this.project.node_modules.isLink) {
          this.project.node_modules.dedupe();
        }
        // this.project.node_modules.stuberizeFrontendPackages();
      }
      this.project.packageJson.save(`${this.project._type} instalation after  [${triggeredMsg}]`);
    }

    if (global.tnpNonInteractive) {
      PROGRESS_DATA.log({ msg: `npm instalation finish ok` });
    }
  }
}
