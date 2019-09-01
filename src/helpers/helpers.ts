import * as _ from 'lodash';
import { HelpersArrayObj } from './helpers-array-obj';
import { HelpersMessages } from './helpers-messages';
import { HelpersStringsRegexes } from './helpers-strings-regexes';
import { HelpersEnvironment } from './helpers-environment';
import { Helpers as HelperNg2Logger } from 'ng2-logger';
//#region @backend
import { Helpers as MorpiHelpers } from 'morphi/helpers';
import { HelpersGit } from './helpers-git.backend';
import { HelpersCliTool } from './helpers-cli-tool.backend';
import { HelpersMorphiFramework } from './helpers-morphi-framework.backend';
import { HelpersProcess } from './helpers-process.backend';
import { TsCodeModifer } from './ts-code-modifier';
import { HelpersNpm } from './helpers-npm.backend';
import { HelpersTerminal } from './helpers-system-terminal.backend';
import { HelpersFileFolders } from './helpers-file-folders.backend';
import { Models } from '../models';
//#endregion
import { Helpers } from './index';

export class HelpersTnp {
  //#region singleton
  private static _instance: HelpersTnp;
  public static get Instance() {
    if (!HelpersTnp._instance) {
      HelpersTnp._instance = new HelpersTnp();
    }
    return HelpersTnp._instance;
  }
  //#endregion

  private constructor(
    public tsCodeModifier = new TsCodeModifer(),
    public arrays = new HelpersArrayObj(),
    public git = new HelpersGit(),
    public npm = new HelpersNpm(),
    public morphi = new HelpersMorphiFramework(),
    public terminal = new HelpersTerminal(),
    public cliTool = new HelpersCliTool()
  ) {

  }

  get isBrowser() {
    return HelperNg2Logger.isBrowser;
  }

  get isNode() {
    return HelperNg2Logger.isNode;
  }

  applyMixins(derivedCtor: any, baseCtors: any[]) {
    baseCtors.forEach(baseCtor => {
      Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
        Object.defineProperty(derivedCtor.prototype, name, Object.getOwnPropertyDescriptor(baseCtor.prototype, name));
      });
    });
  }

  getMethodName(obj, method): string {
    var methodName = null;
    Object.getOwnPropertyNames(obj).forEach(prop => {
      if (obj[prop] === method) {
        methodName = prop;
      }
    });

    if (methodName !== null) {
      return methodName;
    }

    var proto = Object.getPrototypeOf(obj);
    if (proto) {
      return Helpers.getMethodName(proto, method);
    }
    return null;
  }

  fixWebpackEnv(env: Object) {
    _.forIn(env, (v, k) => {
      const value: string = v as any;
      if (value === 'true') env[k] = true;
      if (value === 'false') env[k] = false;
    })
  }

  checkEnvironment = (deps?: Models.morphi.GlobalDependencies) => MorpiHelpers.checkEnvironment(deps)

}

export interface HelpersTnp extends
  HelpersMessages,
  HelpersStringsRegexes,
  HelpersEnvironment,
  //#region @backend
  HelpersProcess,
  HelpersFileFolders
//#endregion
{ }

HelpersTnp.Instance.applyMixins(HelpersTnp, [
  HelpersMessages,
  HelpersStringsRegexes,
  HelpersEnvironment,
  //#region @backend
  HelpersProcess,
  HelpersFileFolders,
  //#endregion
]);


