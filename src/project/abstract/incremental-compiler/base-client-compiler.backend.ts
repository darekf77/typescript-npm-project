import * as chokidar from 'chokidar';
import * as path from 'path';
import * as _ from 'lodash';
import * as glob from 'glob';
import * as fse from 'fs-extra';
import { CLASS } from 'typescript-class-helpers';

import { ChangeOfFile } from './change-of-file.backend';
import { CompilerManager } from './incremental-compiler.backend';
import { FileExtension } from '../../../models';
import { warn } from '../../../helpers/helpers-messages';
import { compilationWrapperTnp } from '../../../helpers/helpers-process';


export interface BaseClientCompilerOptions {
  folderPath?: string;
  asyncWatch?: boolean;
  subscribeOnlyFor?: FileExtension[];
}


export class BaseClientCompiler<RES_ASYNC = any, RES_SYNC = any, ADDITIONAL_DATA = any> {

  private compilationWrapper = compilationWrapperTnp;
  private pathResolve = false;

  //#region folder path
  private __folderPath: string;
  public set folderPath(v) {
    this.__folderPath = v;
  }
  public get folderPath(): string {
    if (!this.pathResolve) {
      this.pathResolve = true;
      if (fse.existsSync(this.__folderPath)) {
        this.__folderPath = path.resolve(this.__folderPath);
      } else {
        warn(`[BaseClientCompiler] client "${CLASS.getNameFromObject(this)}" folderPath doesn't not exist ${this.folderPath}`)
        return void 0;
      }
    }
    return this.__folderPath;
  }
  //#endregion

  public readonly subscribeOnlyFor: FileExtension[] = []
  public readonly asyncWatch: boolean;

  //#region constructor
  constructor(options?: BaseClientCompilerOptions) {
    if (_.isUndefined(options)) {
      options = {} as any;
    }
    if (_.isUndefined(options.asyncWatch)) {
      options.asyncWatch = true;
    }
    if (!_.isArray(options.subscribeOnlyFor)) {
      options.subscribeOnlyFor = []
    }
    if (!_.isString(options.folderPath)) {
      options.folderPath = void 0;
    }
    const { asyncWatch, folderPath, subscribeOnlyFor } = options;
    this.asyncWatch = asyncWatch;
    this.folderPath = folderPath;
    this.subscribeOnlyFor = subscribeOnlyFor;
  }
  //#endregion

  //#region init

  private fixTaskName(taskName: string) {
    if (!_.isString(taskName)) {
      taskName = `task of client "${CLASS.getNameFromObject(this)}"`;
    }
    return taskName;
  }

  /**
   * Do not override this
   */
  public async start(taskName?: string, afterInitCallBack?: () => void) {
    CompilerManager.Instance.addClient(this);
    taskName = this.fixTaskName(taskName)
    await CompilerManager.Instance.syncInit(this)
  }

  /**
   * Do not override this
   */
  public async startAndWatch(taskName?: string, afterInitCallBack?: () => void) {
    taskName = this.fixTaskName(taskName)
    await this.start(taskName, afterInitCallBack);
    if (_.isFunction(this.preAsyncAction)) {
      await this.compilationWrapper(this.preAsyncAction, `pre-async action for ${taskName}`);
    }
    await CompilerManager.Instance.asyncInit(this)
  }
  //#endregion

  //#region actions
  public syncAction(absolteFilesPathes?: string[]): Promise<RES_SYNC> {
    return void 0;
  }
  public async preAsyncAction() { }


  public asyncAction(asyncEvents: ChangeOfFile, additionalData?: ADDITIONAL_DATA): Promise<RES_ASYNC> {
    return void 0;
  }
  //#endregion

}
