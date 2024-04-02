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
  protected constructor() { }
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
  private constructor() {
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
    return from(options, InitOptions);
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
  get libBuild() {
    return this.buildType === 'lib' || this.buildType === 'lib-app';
  }

  get temporarySrcForReleaseCutCode() {
    //#region @backendFunc
    return `tmp-cut-relase-src-${config.folder.dist}${this.websql ? '-websql' : ''}`;
    //#endregion
  }

  private constructor() {
    super();
    this.outDir = 'dist';
    this.targetApp = 'pwa';
  }
  /**
   *
   */
  websql: boolean;
  buildType: 'lib' | 'app' | 'lib-app';

  baseHref: string;
  /**
   * Cut <@>notForNpm  tag from lib build
   */
  cutNpmPublishLibReleaseCode: boolean;
  /**
 * Do not generate backend code
 */
  genOnlyClientCode: boolean;
  /**
   * Generate only backend, without browser version
   */
  onlyBackend: boolean;

  public static from(options: Omit<Partial<BuildOptions>, 'appBuild' | 'serveApp'>): BuildOptions {
    return from(options, BuildOptions);
  }
}
//#endregion

//#region release options
export class ReleaseOptions extends BuildOptionsLibOrApp<ReleaseOptions> {

  private constructor() {
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
    return from(options, ReleaseOptions);
  }
}

//#endregion

function from(options: Partial<InitOptions | BuildOptions | ReleaseOptions>, classFn: Function) {
  const orgFinishCallback = options?.finishCallback;
  options = (options ? options : {}) as any;
  const res = _.merge(new (classFn as any)(), _.cloneDeep(options));
  if (orgFinishCallback) {
    res.finishCallback = orgFinishCallback;
  } else {
    res.finishCallback = () => { }
  }
  return res;
}
