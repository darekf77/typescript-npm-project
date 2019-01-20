import { LibType } from './lib-type';
import { EnvironmentName } from './environment-name';


export type DependenciesFromPackageJsonStyle = { [name: string]: string; }

export interface IPackageJSON {
  name: string;
  version: string;
  bin?: any;
  main?: string;
  preferGlobal?: boolean;
  engines?: { node: string; npm: string; }
  license?: string;

  dependencies?: DependenciesFromPackageJsonStyle;
  devDependencies?: DependenciesFromPackageJsonStyle;
  tnp: {
    type: LibType;
    isCoreProject: boolean;
    isCommandLineToolOnly?: boolean;
    core: {
      dependencies: {
        always?: string[];
        asDevDependencies?: string[];
        dedupe: string[];
        common: DependenciesFromPackageJsonStyle | { [groupAlias: string]: DependenciesFromPackageJsonStyle };

        // libtype of workspace project
        onlyFor: { [libType: string]: DependenciesFromPackageJsonStyle | { [groupAlias: string]: DependenciesFromPackageJsonStyle }; }
      }
    }
    basedOn: string,
    basedOnAbsolutePath1: string, // TODO QUICK_FIX
    basedOnAbsolutePath2: string, // TODO QUICK_FIX
    resources?: string[];
    allowedEnv?: EnvironmentName[];
    isGenerated?: boolean;
    overrided: {
      dedupe?: string[];
      ignoreDepsPattern?: string[];
      includeOnly?: string[];
      includeAsDev?: string[];
      dependencies?: DependenciesFromPackageJsonStyle;
    }
    // requiredLibs?: string[];
  };
}
