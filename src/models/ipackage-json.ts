import { LibType } from './lib-type';
import { EnvironmentName } from './environment-name';

export type NpmDependencyType = 'dependencies' | 'devDependencies' | 'peerDependencies' | 'optionalDependencies'
  | 'bundleDependencies' | 'bundledDependencies' | 'extensionDependencies'
  | '_phantomChildren';

export type TnpNpmDependencyType = 'tnp_overrided_dependencies' | 'tnp_required_workspace_child';

export const ArrNpmDependencyType: NpmDependencyType[] = [
  'dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies', ,
  'bundleDependencies', 'bundledDependencies', 'extensionDependencies', '_phantomChildren'
]

export const ArrTnpNpmDependencyType: TnpNpmDependencyType[] = [
  'tnp_overrided_dependencies', 'tnp_required_workspace_child'
]



export type InstalationType = '-g' | '--save' | '--save-dev';

export const InstalationTypeArr = ['-g', '--save', '--save-dev'];

export type Package = { name: string; version?: string; installType?: InstalationType; };

export type DependenciesFromPackageJsonStyle = { [name: string]: string; }

export interface IPackageJSON {
  name: string;
  husky?: {
    hooks: {
      'pre-push': string;
    }
  }
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
    useFramework: boolean;
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
    /**
     * Usable only in workspace children
     * Required workspace children for particular workspcae child
     */
    required?: string[],
    /**
     * Override tnp automation generation
     */
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
