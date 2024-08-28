import { CoreModels, _ } from 'tnp-core/src';

export namespace Models {
  export type TestTypeTaon = 'mocha' | 'jest' | 'cypress';
  export const TestTypeTaonArr = [
    'mocha',
    'jest',
    'cypress',
  ] as TestTypeTaon[];

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

  export interface TaonLoaderConfig {
    name?: TaonLoaders;
    color?: string;
  }

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

  export type TaonLoaders =
    | 'lds-default'
    | 'lds-ellipsis'
    | 'lds-facebook'
    | 'lds-grid'
    | 'lds-heart'
    | 'lds-ripple';

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
    linkedRepos?: LinkedRepo[];

    /**
     * worker plugins for cli
     *
     * workerPlugin: {
     *  'tnp-db': '',
     *  'tnp-db-autoupdate': '/up'
     * }
     */
    workerPlugins?: { [pathOrName in string]: string };

    targetProjects: TargetProject[];
    /**
     * framework available inside project/app
     */
    frameworks?: CoreModels.UIFramework[];

    additionalNpmNames: boolean;
    /**
     * only for container
     */
    overrideCoreDeps?: boolean;
    /**
     * Easy way to skip browser compilation
     */
    isCommandLineToolOnly?: boolean;
    isGlobalSystemTool?: boolean;
    /**
     * Only for isomorphic lib
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
    tnp: TnpData & TnpIPackageJSONOverride;
    taon: TnpData & TnpIPackageJSONOverride;
  }

  /**
   * @deprecated
   */
  export type DependenciesFromPackageJsonStyle = { [name: string]: string };

  export interface ProjectForAutoBuild {
    cwd: string;
    command: string;
    commandWatch: string;
    args?: string[];
  }

  export interface ProjectForAutoRelease {
    cwd: string;
    command: string;
    args?: string[];
  }

  export interface AutoActionsUser {
    builds?: ProjectForAutoBuild[];
    autoreleases?: ProjectForAutoRelease[];
  }

  export interface TscCompileOptions {
    cwd: string;
    watch?: boolean;
    outDir?: BuildDir;
    generateDeclarations?: boolean;
    tsExe?: string;
    diagnostics?: boolean;
    hideErrors?: boolean;
    debug?: boolean;
  }

  export interface BuildServeArgsServe {
    port: string;
    baseUrl: string;
    outDir: string;
  }

  export type BuildDir = 'dist';
  export type BuildDirBrowser = 'browser' | 'websql';

  export type InlinePkg = {
    isIsomorphic: boolean;
    realName: string;
  };

  export type ModifiedFiles = { modifiedFiles: string[] };

  export class Range {
    static clone(r: Range) {
      return new Range(r.from, r.to);
    }

    static from(from: number) {
      // const self = this;
      return {
        to(to: number) {
          return new Range(from, to);
        },
      };
    }

    constructor(
      public from: number,
      public to: number,
    ) {
      if (_.isNative(from) || _.isNative(to)) {
        throw new Error(`This Range type is only for positive numbers`);
      }
    }

    get length() {
      return this.to - this.from;
    }

    get array() {
      const arr = [];
      for (let index = this.from; index <= this.to; index++) {
        arr.push(index);
      }
      return arr;
    }

    contains(anotherRangeOrNumber: Range | number) {
      if (_.isNumber(anotherRangeOrNumber)) {
        return (
          anotherRangeOrNumber >= this.from && anotherRangeOrNumber <= this.to
        );
      }
      anotherRangeOrNumber = anotherRangeOrNumber as Range;

      return (
        anotherRangeOrNumber.from >= this.from &&
        anotherRangeOrNumber.to <= this.to
      );
    }
  }

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

  export type SourceFolder = 'src' | 'components' | 'custom' | 'tmp-src';

  export const ImageFileExtensionArr: CoreModels.ImageFileExtension[] = [
    'jpg',
    'jpeg',
    'png',
    'svg',
  ];

  export type RecreateFile = { where: string; from: string; linked?: boolean };

  export type Tnp = TnpData & TnpIPackageJSONOverride;

  export interface RegisterServiceOptions {
    killAlreadyRegisterd?: boolean;
    actionWhenAssignedPort?: (
      itWasRegistered: boolean,
      registerdOnPort?: number,
    ) => any;
  }

  export class SystemService {
    constructor(
      public name: string,
      public description?: string,
    ) {}
  }

  export interface PsListInfo {
    pid: number;
    ppid: number;
    memory: number;
    cpu: number;
    name: string;
    cmd: string;
  }
}
