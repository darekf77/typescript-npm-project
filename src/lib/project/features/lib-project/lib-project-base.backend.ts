import { BaseFeatureForProject, Helpers } from 'tnp-helpers/src';
import { Project } from '../../abstract/project';
import { config } from 'tnp-config/src';
import { _ } from 'tnp-core/src';

export abstract class LibPorjectBase extends BaseFeatureForProject<Project> {
  abstract buildDocs(
    prod: boolean,
    realCurrentProj: Project,
    automaticReleaseDocs: boolean,
    libBuildCallback: (websql: boolean, prod: boolean) => any,
  ): Promise<boolean>;
  abstract publish(options: {
    realCurrentProj: Project;
    newVersion: string;
    automaticRelease: boolean;
    prod: boolean;
    rootPackageName?: string;
  }): Promise<any>;

  abstract preparePackage(smartContainer: Project, newVersion: string);

  messages = {
    productionMode: `Do you want build in production mode`,
    docsBuildQuesions: `Do you wanna build /docs folder app for preview`,
    docsBuildDone: `

    Building docs preview - done

    `,
  };

  // async bumpVersionInOtherProjects(
  //   newVersion,
  //   onlyInThisProjectSubprojects = false,
  // ) {
  //   if (onlyInThisProjectSubprojects) {
  //     // console.log('UPDATE VERSION !!!!!!!!!!!!!')
  //     updateChildrenVersion(this.project, newVersion, this.project.name);
  //   } else {
  //     if (Project.ins.Tnp.name === this.project.name) {
  //       Helpers.info(
  //         `Ommiting version bump ${this.project.name} - for ${config.frameworkName} itself`,
  //       );
  //     } else if (
  //       this.project.__packageJson.hasDependency(Project.ins.Tnp.name)
  //     ) {
  //       Helpers.info(
  //         `Ommiting version bump ${this.project.name} - has ${config.frameworkName} as dependency`,
  //       );
  //     } else {
  //       Project.ins.Tnp.__packageJson.setDependencyAndSave(
  //         {
  //           name: this.project.name,
  //           version: newVersion,
  //         },
  //         `Bump new version "${newVersion}" of ${this.project.name}`,
  //       );
  //     }
  //   }
  // }

  //#region update core/special projects/container
  async updateTnpAndCoreContainers(
    realCurrentProj: Project,
    newVersion: string,
  ): Promise<void> {
    //#region @notForNpm

    const allVersions = Helpers.uniqArray([
      ...config.activeFramewrokVersions,
      realCurrentProj.__frameworkVersion,
    ]);

    const coreContainters = allVersions.map(v =>
      Project.by('container', v),
    ) as Project[];

    const tnpProj = Project.ins.Tnp;
    const updateLocalFiredevProjectWithOwnNodeModules =
      config.frameworkName === 'tnp' &&
      realCurrentProj.name !== 'tnp' &&
      allVersions.includes(tnpProj.__frameworkVersion);

    const projectForCodeUpdate = [
      ...(updateLocalFiredevProjectWithOwnNodeModules ? [tnpProj] : []),
      ...coreContainters,
    ].filter(f => !!f);

    for (const coreContainer of coreContainters) {
      for (const packageName of realCurrentProj.packageNamesFromProject) {
        coreContainer.npmHelpers.updateDep({
          packageName: packageName,
          version: newVersion,
          updateFiredevJsonFirst: true,
        });
      }
    }

    for (const projToUpdate of projectForCodeUpdate) {
      await projToUpdate.__node_modules.updateFromReleaseDist(realCurrentProj);
    }

    //#endregion
  }
  //#endregion
}
