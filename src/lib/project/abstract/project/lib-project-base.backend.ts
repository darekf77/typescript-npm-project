import { Project } from "./project";

export abstract class LibPorjectBase {
  constructor(
    protected project: Project
  ) {

  }
  abstract buildDocs(prod: boolean, newVersion: string, realCurrentProj: Project): Promise<boolean>;
  abstract publish(options: {
    realCurrentProj: Project,
    newVersion: string,
    automaticRelease: boolean,
    prod: boolean,
    rootPackageName?: string,
  }): Promise<any>

  abstract preparePackage(smartContainer: Project, newVersion: string);

  messages = {
    productionMode: `Do you want build in production mode`,
    docsBuildQuesions : `Do you wanna build /docs folder app for preview`,
    docsBuildDone: `

    Building docs preview - done

    `
}
}
