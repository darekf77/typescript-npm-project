import { ConfigModels } from "tnp-config";
import { Project } from "../../abstract/project/project";

export type Opt = {
  outFolder: ConfigModels.OutFolder;
  projectName: string;
  client?: Project;
  replacement: Function;
};

export type LinkType = (options: Opt) => string;
export type EndAction = (options: Opt) => void;

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
    public projtectType?: ConfigModels.NewFactoryType,
    public frameworkVersion?: ConfigModels.FrameworkVersion,
    public pathReplacements: [string, LinkType][] = [],
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
    return Project.by(this.projtectType, this.frameworkVersion) as Project;
  }


  //#endregion
}
