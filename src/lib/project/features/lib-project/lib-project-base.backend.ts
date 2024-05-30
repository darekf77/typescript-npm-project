import { BaseFeatureForProject } from 'tnp-helpers/src';
import { Project } from '../../abstract/project';

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
}
