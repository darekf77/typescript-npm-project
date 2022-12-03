import { ConfigModels } from 'tnp-config';
import { Project } from '../../abstract/project/project';

export type Opt = {
  outFolder?: ConfigModels.OutFolder;
  projectName?: string;
  projectLocation?: string;
  client?: Project;
  replacement?: Function;
  watchBuild?: boolean;
};

export type LinkType = (options: Opt) => string;
export type LinkTypePathRep = (options: Omit<Opt, 'replacement'>) => string;
export type EndAction = (options: Opt) => void;

/**
 * This class will exectute algorithm
 * 1. Copy replative pathes to proper destination files/folders
 * 2. Link node_modules to desitnation projects
 */
export class InsideStruct {

  //#region @backend
  static from(options: Partial<InsideStruct>) {
    const obj = new InsideStruct();
    Object.keys(options)
      .forEach(key => {
        const v = options[key];
        if (!!v) {
          obj[key] = v;
        }
      });
    return obj;
  }

  private constructor(
    public relateivePathesFromContainer?: string[],
    public projectType?: ConfigModels.NewFactoryType,
    public frameworkVersion?: ConfigModels.FrameworkVersion,
    /**
     * Replace pathes while copying relateivePathesFromContainer
     * to destination project
     */
    public pathReplacements: [string | RegExp, LinkTypePathRep][] = [],
    public linkNodeModulesTo: string[] = [],
    public linksFuncs: [
      /**
       * orginal real path
       */
      LinkType,
      /**
       * destination path
       */
      LinkType
    ][] = [],
    public endAction?: EndAction,
  ) {

  }

  public get coreContainer() {
    return Project.by(this.projectType, this.frameworkVersion) as Project;
  }

  recreate(outFolder: ConfigModels.OutFolder = 'dist') {

  }


  //#endregion
}
