import { CoreModels, _ } from 'tnp-core';
import type { Project } from './project/abstract/project';
import { config } from 'tnp-config/src';
import { Models } from './models';
import { CLASS } from 'typescript-class-helpers/src';

//#region build options lib or app
class SystemTask<T> {
  /**
   * watch build
   */
  watch: boolean;
  constructor() {
    this.finishCallback = () => { };
  }
  finishCallback: () => any;
  public clone(override: Partial<T>): T {
    const classFn = CLASS.getFromObject(this);
    const result = _.merge(new (classFn)(), _.merge(_.cloneDeep(this), override));
    // console.log({result})
    return result;
  }
}

class BuildOptionsLibOrApp<T> extends SystemTask<T> {
  cliBuildNoDts: boolean;
  cliBuildUglify: boolean;
  cliBuildObscure: boolean;
  cliBuildIncludeNodeModules: boolean;
  /**
   * Enable all production optimalization for build
   * - minification
   * - caches
   * etc.
   */
  prod: boolean;
  smartContainerTargetName: string;
}
//#endregion

//#region new options
export class NewOptions extends SystemTask<NewOptions> {
  branding: boolean;
}
//#endregion

//#region init options
export class InitOptions extends SystemTask<InitOptions> {
  readonly alreadyInitedPorjects: Project[];
  constructor() {
    super();
    this.alreadyInitedPorjects = [];
  }

  /**
   * @deprecated
   */
  recrusive: boolean;
  initiator: Project;
  /**
   * init only structre without deps
   */
  struct: boolean;
  websql: boolean;
  smartContainerTargetName: string;
  branding: boolean;

  public static from(options: Partial<InitOptions>): InitOptions {
    options = options ? options : {};
    return _.merge(new InitOptions(), _.cloneDeep(options))
  }
}
//#endregion

//#region build options
export class BuildOptions extends BuildOptionsLibOrApp<BuildOptions> {
  readonly outDir: 'dist';
  readonly targetApp: 'pwa' | 'electron';
  get appBuild() {
    return this.buildType === 'app' || this.buildType === 'lib-app';
  }
  get serveApp() {
    return this.buildType === 'lib-app';
  }
  get temporarySrcForReleaseCutCode() {
    //#region @backendFunc
    return `tmp-cut-relase-src-${config.folder.dist}${this.websql ? '-websql' : ''}`;
    //#endregion
  }

  constructor() {
    super();
    this.outDir = 'dist';
    this.targetApp = 'pwa';
  }
  /**
   * ci build
   */
  ci: boolean;
  /**
   *
   */
  websql: boolean;
  buildType: 'lib' | 'app' | 'lib-app';

  baseHref: string;
  /**
   * Cut notForNpm  tag from lib build
   */
  codeCutRelease: boolean;
  /**
   * Special lib build for app (not npm lib)
   */
  forAppRelaseBuild: boolean;
  /**
 * Do not generate backend code
 */
  genOnlyClientCode: boolean;
  /**
   * Generate only backend, without browser version
   */
  onlyBackend: boolean;

  public static from(options: Partial<BuildOptions>): BuildOptions {
    return _.merge(new BuildOptions(), _.cloneDeep(options))
  }
}
//#endregion

//#region release options
export class ReleaseOptions extends BuildOptionsLibOrApp<ReleaseOptions> {

  constructor() {
    super();
    this.releaseType = 'patch';
    this.resolved = [];
  }
  releaseType: Models.ReleaseType;
  shouldReleaseLibrary: boolean;
  /**
   * build action only for specyfic framework version of prohect
   */
  frameworkVersion: CoreModels.FrameworkVersion;

  /**
   * Projects to release in container
   */
  resolved: Project[];
  useTempFolder: boolean;
  /**
   * quick automatic release of lib
   */
  automaticRelease: boolean;
  /**
  * quick automatic release of docs app(s)
  */
  automaticReleaseDocs: boolean;
  bumbVersionIn: string[];
  specifiedVersion: string;
  releaseTarget: 'lib' | 'app' | 'lib-app';
  public static from(options: Partial<ReleaseOptions>): ReleaseOptions {
    return _.merge(new ReleaseOptions(), _.cloneDeep(options))
  }
}

//#endregion
