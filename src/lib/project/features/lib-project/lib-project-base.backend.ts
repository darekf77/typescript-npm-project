import { BaseFeatureForProject } from 'tnp-helpers/src';
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

  //#region update core/special projects/container
  updateTnpAndCoreContainers(realCurrentProj: Project) {
    //#region @notForNpm
    const tnpProj = Project.ins.Tnp;

    const updateLocalFiredevProjectWithOwnNodeModules =
      config.frameworkName === 'tnp' &&
      realCurrentProj.name !== 'tnp' &&
      realCurrentProj.__frameworkVersion === tnpProj.__frameworkVersion;

    const coreContainter = Project.by( // TODO not needed ??
      'container',
      realCurrentProj.__frameworkVersion,
    ) as Project;

    [
      ...(updateLocalFiredevProjectWithOwnNodeModules ? [tnpProj] : []),
      coreContainter,
    ]
      .filter(f => !!f)
      .forEach(c => {
        c.__node_modules.updateFromReleaseDist(realCurrentProj);
      });

    //#endregion
  }
  //#endregion
}
