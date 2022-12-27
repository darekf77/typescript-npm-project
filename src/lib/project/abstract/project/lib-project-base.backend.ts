import { Project } from "./project";

export abstract class LibPorjectBase {
  constructor(
    protected lib: Project
  ) {

  }
  abstract buildDocs(prod: boolean, newVersion: string, realCurrentProj: Project): Promise<any>;
  abstract publish(options: {
    realCurrentProj: Project,
    newVersion: string,
    automaticRelease: boolean,
    prod: boolean,
    rootPackageName?: string,
  }): Promise<any>

  abstract preparePackage(smartContainer: Project, newVersion: string);
}
