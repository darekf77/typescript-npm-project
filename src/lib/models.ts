import { CoreModels, _ } from 'tnp-core/src';
import type { Project } from './project/abstract/project';

export namespace Models {
  //#region taon test type
  export type TestTypeTaon = 'mocha' | 'jest' | 'cypress';
  export const TestTypeTaonArr = ['mocha', 'jest', 'cypress'] as TestTypeTaon[];
  //#endregion

  //#region taon npm package type
  export type SaveAction = 'save' | 'show' | 'hide';

  export type PackageJsonSaveOptions = {
    action: SaveAction;
    newDeps: any;
    toOverride: any;
    reasonToShowPackages: string;
    reasonToHidePackages: string;
  };

  export interface NpmInstallOptions {
    remove?: boolean;
    npmPackages?: CoreModels.Package[];
  }

  export type NpmDependencyType =
    | 'dependencies'
    | 'devDependencies'
    | 'peerDependencies'
    | 'optionalDependencies'
    | 'extensionDependencies'
    | '_phantomChildren';

  export type TnpNpmDependencyType = 'tnp_overrided_dependencies';

  export const ArrNpmDependencyType: NpmDependencyType[] = [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies',
    ,
    'extensionDependencies',
    '_phantomChildren',
  ];

  export const ArrTnpNpmDependencyType: TnpNpmDependencyType[] = [
    'tnp_overrided_dependencies',
  ];
  //#endregion

  //#region taon fe app loader
  export interface TaonLoaderConfig {
    name?: TaonLoaders;
    color?: string;
  }

  export type TaonLoaders =
    | 'lds-default'
    | 'lds-ellipsis'
    | 'lds-facebook'
    | 'lds-grid'
    | 'lds-heart'
    | 'lds-ripple';
  //#endregion

  //#region env config
  export interface EnvConfigProject {
    baseUrl: string;
    host?: string; // generated
    externalHost?: string;
    name: string; // checked
    type?: CoreModels.LibType; // checked

    port: number; // override type port
    //#region @backend
    $db?: any;
    ommitAppBuild?: boolean;
    isWatchBuild?: boolean; // generated
    isWebsqlBuild?: boolean; // generated
    //#endregion
  }

  export interface EnvConfig {
    /**
     * angular production mode
     */
    angularProd?: boolean;
    /**
     * replace title in taon app
     */
    title?: string;
    /**
     * override pwa manifest values
     */
    pwa?: {
      name?: string;
      short_name?: string;
      start_url?: string;
      // theme_color?: string;
      // background_color?: string;
      // display?: string;
      // scope?: string;
    };

    loading?: {
      /**
       * this is persented before boostrapign of angular
       * at the begining of first index.html fetch
       */
      preAngularBootstrap?: {
        /**
         * loder path to image or
         * build in loader config
         */
        loader?: string | TaonLoaderConfig;
        background?: string;
      };
      /**
       * this loader is presented when
       * taon app data is being loader
       * (right after *preAngularBootstrap*)
       */
      afterAngularBootstrap?: {
        /**
         * loder path to image or
         * build in loader config
         */
        loader?: string | TaonLoaderConfig;
        background?: string;
      };
    };

    pathes?: any;
    config?: any;
    configsFromJs?: any;
    /**
     * I will check if code should be available for npm version
     */
    notForNpm?: boolean;
    isCoreProject?: boolean; // generated
    isStandaloneProject?: boolean; // generated
    isSmartContainer?: boolean; // generated
    isSmartContainerTargetProject?: boolean; // generated
    name?: CoreModels.EnvironmentName; // generated
    frameworks?: CoreModels.UIFramework[];
    /**
     * override domain name (use useDomain property to make it work)
     */
    domain?: string;
    /**
     * actually build enviroment for domain from enviroment.js
     */
    useDomain?: boolean;
    dynamicGenIps?: boolean;
    ip?: string | 'localhost';
    workspace: {
      workspace: EnvConfigProject;
      build?: {
        browser: {
          minify: boolean;
          aot: boolean;
          production: boolean;
        };
        server: {
          minify: boolean;
          production: boolean;
        };
      };
      projects: EnvConfigProject[];
    };
    clientProjectName?: string;
    currentLibProjectSourceFolder?: 'src' | 'components';
    currentProjectName?: string;
    currentProjectGenericName?: string;
    currentProjectLaunchConfiguration?: string;
    currentProjectTasksConfiguration?: string;
    currentProjectPort?: number;
    currentProjectLocation?: string;
    currentFrameworkVersion?: string;
    currentProjectIsSite?: boolean;
    currentProjectIsStrictSite?: boolean;
    currentProjectIsDependencySite?: boolean;
    currentProjectIsStatic?: boolean;
    currentProjectComponentsFolder?: string;
    currentProjectTsConfigPathes?: string;
    currentProjectTsConfigPathesForBrowser?: string;
    currentProjectType?: CoreModels.LibType;
    packageJSON?: IPackageJSON;

    cloud?: {
      ports: {
        update: number;
      };
    };

    build?: {
      number?: number;
      hash?: string;
      date?: Date;
      options?: {
        isWatchBuild?: boolean;
        isWebsqlBuild?: boolean;
        outDir?: 'dist';
      };
    };
  }
  //#endregion

  //#region site option
  export type NewSiteOptions = {
    type?: CoreModels.NewFactoryType;
    name?: string;
    cwd?: string;
    basedOn?: string;
    version?: CoreModels.FrameworkVersion;
    skipInit?: boolean;
    alsoBasedOn?: string[];
    siteProjectMode?: 'strict' | 'dependency';
  };
  //#endregion

  //#region taon.json config @deprecated
  /**
   * @deprecated
   */
  export type TargetProject = {
    path?: string;
    origin: string;
    branch: string;
    links: string[];
  };

  /**
   * use CoreModels.TaonJson
   * @deprecated
   */
  export interface TnpIPackageJSONOverride extends CoreModels.TaonJson {
    scripts?: { [script in string]: string };
    description?: string;
    license?: string;
    /**
     * if true => package is private
     */
    private?: boolean;
    author?: string;
    homepage?: string;
    main?: string;
    module?: string;
    exports?: object;
    name?: string;
  }

  export type TrustedType = {
    [frameworkVersion in CoreModels.FrameworkVersion]: string | string[];
  };

  export type LinkedRepo = {
    origin: string;
    relativeFoldersLinks?: {
      from: string;
      to: string;
    }[];
  };

  export interface TnpData extends TnpIPackageJSONOverride {
    /**
     * for type-orm fork
     */
    linkedRepos?: LinkedRepo[];

    /**
     * @deprecated
     * worker plugins for cli
     *
     * workerPlugin: {
     *  'tnp-db': '',
     *  'tnp-db-autoupdate': '/up'
     * }
     */
    workerPlugins?: { [pathOrName in string]: string };

    /**
     * let project use it own node_modules instead linking
     * them from core container
     */
    usesItsOwnNodeModules?: boolean;

    targetProjects: TargetProject[];
    /**
     * @deprecated
     * framework available inside project/app
     */
    frameworks?: CoreModels.UIFramework[];

    /**
     * @deprecated
     */
    additionalNpmNames: boolean;
    /**
     * only for container
     */
    overrideCoreDeps?: boolean;
    /**
     * Easy way to skip browser compilation
     * @deprecated
     */
    isCommandLineToolOnly?: boolean;
    /**
     * @deprecated
     */
    isGlobalSystemTool?: boolean;
    /**
     * Only for isomorphic lib
     * @deprecated
     * - if true => generate controllers.ts, entities.ts
     */
    useFramework: boolean;
    /**
     * Core and contant dependecies for all projects
     */
    core: {
      dependencies: {
        /**
         * this dependenices are always included in some way
         */
        always?: string[];
        /**
         * this dependencies are only included as devDependencies
         */
        asDevDependencies?: string[];
        trusted: TrustedType;
        /**
         * list of package to dedupe
         */
        dedupe: string[];

        stubForBackend: string[];
        /**
         * Comon dependencies for all kinds of project types
         */
        common:
          | DependenciesFromPackageJsonStyle
          | { [groupAlias: string]: DependenciesFromPackageJsonStyle };
        /**
         * Dependencies only for specyfic project type
         */
        onlyFor: {
          [libType: string]:
            | DependenciesFromPackageJsonStyle
            | { [groupAlias: string]: DependenciesFromPackageJsonStyle };
        };
      };
    };

    /**
     * dependency site baselines
     */
    dependsOn: string[];
    /**
     * Static resurces for standalone project, that are
     * going to be included in release dist
     */
    resources?: string[];
    /**
     * Allowed environment for poroject
     */
    allowedEnv?: CoreModels.EnvironmentName[];

    /**
     * Override automation generation
     */
    overrided: {
      tsconfig?: Object;
      dedupe?: string[];
      ignoreDepsPattern?: string[];
      includeOnly?: string[];
      includeAsDev?: string[] | '*';
      linkedFolders?: { from: string; to: string }[];
      dependencies?: DependenciesFromPackageJsonStyle;
    };
  }
  //#endregion

  //#region package.json @deprecated
  export type TaonConfig = TnpData & TnpIPackageJSONOverride;

  /**
   * @deprecated use CoreModels.TaonJson
   */
  export interface IPackageJSON
    extends Omit<TnpIPackageJSONOverride, 'version'> {
    name: string;
    husky?: {
      hooks: {
        'pre-push': string;
      };
    };
    version?: string;
    bin?: any;
    preferGlobal?: boolean;
    lastBuildTagHash?: string;
    engines?: { node: string; npm: string };
    dependencies?: DependenciesFromPackageJsonStyle;
    peerDependencies?: DependenciesFromPackageJsonStyle;
    devDependencies?: DependenciesFromPackageJsonStyle;
    tnp: TaonConfig;
    taon: TaonConfig;
  }
  /**
   * @deprecated
   */
  export type DependenciesFromPackageJsonStyle = { [name: string]: string };

  //#endregion

  //#region  build dir
  export type BuildDir = 'dist';
  export type BuildDirBrowser = 'browser' | 'websql';
  //#endregion

  //#region cli root args
  // TODO make it more visible
  export type RootArgsType = {
    tnpNonInteractive: boolean;
    tnpShowProgress: boolean;
    tnpNoColorsMode: boolean;
    findNearestProject: boolean;
    findNearestProjectWithGitRoot: boolean;
    findNearestProjectType: CoreModels.LibType;
    findNearestProjectTypeWithGitRoot: CoreModels.LibType;
    cwd: string;
  };
  //#endregion

  //#region generate project copy
  export interface GenerateProjectCopyOpt {
    override?: boolean;
    markAsGenerated?: boolean;
    regenerateOnlyCoreProjects?: boolean;
    forceCopyPackageJSON?: boolean;
    filterForReleaseDist?: boolean;
    showInfo?: boolean;
    ommitSourceCode?: boolean;
    regenerateProjectChilds?: boolean;
    useTempLocation?: boolean;
    /**
     * copy links as folders and files
     */
    dereference?: boolean;
  }
  //#endregion

  //#region ps list info
  export interface PsListInfo {
    pid: number;
    ppid: number;
    memory: number;
    cpu: number;
    name: string;
    cmd: string;
  }
  //#endregion

  export interface CreateJsonSchemaOptions {
    project: Project;
    nameOfTypeOrInterface: string;
    relativePathToTsFile: string;
  }

  //#region DocsConfig
  export interface DocsConfig {
    /**
     * override site name (default is project name)
     */
    site_name: string;
    /**
     * relative pathes (or titles) of md files
     * for proper order
     */
    priorityOrder?: string[];
    /**
     * glob pattern to omit files by title
     */
    omitFilesPatters: string[];
    /**
     * relative path to the assets folders in project
     * [external assets not allowed... use externalDocs for that]
     */
    // additionalAssets: string[];
    /**
     * include external docs
     * inside this docs
     */
    externalDocs: {
      mdfiles: {
        /**
         * path to *.md file
         * Examples:
         * taon-core/README.md
         * taon-core/docs/README.md # deep pathes allowed
         */
        packageNameWithPath: string;
        /**
         * if you want to rename something inside file
         * you can use this magic rename rules
         * example:
         *
         * framework-name => new-framework-name
         *
         * example with array:
         *
         * framework-name => new-framework-name, framework-name2 => new-framework-name2
         */
        magicRenameRules?: string;
        /**
         * override menu item name (by default titile is relative path)         *
         */
        overrideTitle?: string;
      }[];
      projects: {
        /**
         * default README.md file
         * If array -> file will be join and first file will be used as title
         */
        packageNameWithPath?: string | string[];
        /**
         * override menu item name
         */
        overrideTitle?: string;
      }[];
    };
    /**
     * rename/override titles in menu, exmaple:
     * README.md => Home
     */
    mapTitlesNames: {
      [title: string]: string;
    };
    customJsPath?: string;
    customCssPath?: string;
  }
  //#endregion
}
