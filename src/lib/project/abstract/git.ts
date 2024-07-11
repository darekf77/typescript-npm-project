import { config } from 'tnp-config/src';
import type { Project } from './project';
import { BaseGit, Helpers } from 'tnp-helpers/src';
import { chalk, path } from 'tnp-core/src';

export class Git extends BaseGit<Project> {

  //#region getters & methods / before push action
  protected async _beforePushProcessAction() {
    //#region @backendFunc
    await super._beforePushProcessAction();

    if (
      !this.project.git.originURL &&
      this.project.__isContainerChild &&
      !this.project.__isSmartContainerChild
    ) {
      this.project
        .run(
          `git remote add ${origin} ${this.project.parent.git.originURL.replace(
            this.project.parent.name,
            this.project.name,
          )}`,
        )
        .sync();
    }

    this.project.removeFolderByRelativePath('node_modules/husky');

    if (this.project.name === 'firedev') {
      config.activeFramewrokVersions.forEach(frameworkVersion => {
        // console.log(`Active Framework: ${frameworkVersion}`)
        const morphiProjectContainerPath = path.join(
          this.project.location,
          'projects',
          `container${frameworkVersion === 'v1' ? '' : `-${frameworkVersion}`}`,
        );
        const containerCoreForVersion = this.project.ins.From(
          morphiProjectContainerPath,
        ) as Project;
        if (containerCoreForVersion) {
          Helpers.info(
            `[${config.frameworkName}] updating on push global container${
              frameworkVersion === 'v1' ? '' : `-${frameworkVersion}`
            } in ${this.project.name}`,
          );
          containerCoreForVersion.__packageJson.save(
            'Updating morphi container',
          );
        } else {
          Helpers.warn(
            `[firedev][hotfix] Not able to find container for framework version ${frameworkVersion}`,
          );
        }
      });
    }
    if (this.project.__targetProjects.exists) {
      Helpers.warn(`

      Don't forget to push target projects for project ${chalk.bold(this.project.name)}

      `);
    }
    //#endregion
  }
  //#endregion

  //#region getters & methods / before pull action
  protected async _beforePullProcessAction() {
    //#region @backendFunc
    await super._beforePullProcessAction();
    // await Helpers.killAllNodeExceptCurrentProcess();
    //#endregion
  }
  //#endregion
}
