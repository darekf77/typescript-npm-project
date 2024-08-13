import { BaseFeatureForProject, Helpers } from 'tnp-helpers/src';
import { Project } from '../../abstract/project';
import { config } from 'tnp-config/src';
import { _ } from 'tnp-core/src';

export abstract class LibPorjectBase extends BaseFeatureForProject<Project> {
  //#region build docs
  abstract buildDocs(
    prod: boolean,
    realCurrentProj: Project,
    automaticReleaseDocs: boolean,
    libBuildCallback: (websql: boolean, prod: boolean) => any,
  ): Promise<boolean>;
  //#endregion

  //#region publish
  abstract publish(options: {
    realCurrentProj: Project;
    newVersion: string;
    automaticRelease: boolean;
    prod: boolean;
    rootPackageName?: string;
  }): Promise<any>;
  //#endregion

  //#region prepare pacakge
  abstract preparePackage(smartContainer: Project, newVersion: string);
  //#endregion

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
      // console.log(
      //   `[updateTnpAndCoreContainers] Updating ${coreContainer.genericName}...`,
      // );
      for (const packageName of realCurrentProj.packageNamesFromProject) {
        await coreContainer.npmHelpers.updateDep({
          packageName: packageName,
          version: newVersion,
          updateFiredevJsonFirst: true,
          addIfNotExists: true,
        });
      }
    }

    for (const projToUpdate of projectForCodeUpdate) {
      await projToUpdate.__node_modules.updateFromReleaseDist(realCurrentProj);
      Helpers.taskDone('Done updating core container: ' + projToUpdate.genericName);
    }

    //#endregion
  }
  //#endregion
}
