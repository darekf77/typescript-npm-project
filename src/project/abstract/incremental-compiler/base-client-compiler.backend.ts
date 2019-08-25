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

function AfterAsyncAction(unsub?: (change: ChangeOfFile, target: Function) => any) {
  return function (target: any, m, c) {
    // TODO

    ///
  } as any;
}

@AfterAsyncAction((c, target) => {
  CompilerManager.Instance.changeExecuted(c, target);
})
export class BaseClientCompiler<RES_ASYNC = any, RES_SYNC = any> {

  private __folderPath: string;
  private pathResolve = false;

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
  constructor(
    folderPath: string,
    public subscribeOnlyFor: FileExtension[] = []
  ) {
    this.folderPath = folderPath;
  }

  /**
   * Do not override this
   */
  public async init() {
    console.log(`init() ${CLASS.getNameFromObject(this)}`)
    await CompilerManager.Instance.syncInit(this)
  }

  /**
   * Do not override this
   */
  public async initAndWatch() {
    // console.log(`initAndWatch()  ${CLASS.getNameFromObject(this)}`)
    await CompilerManager.Instance.asyncInit(this)
  }

  public syncAction(absolteFilesPathes?: string[]): Promise<RES_SYNC> {
    return void 0;
  }

  public async preAsyncAction(asyncEvents: ChangeOfFile) {

  }

  public asyncAction(asyncEvents: ChangeOfFile): Promise<RES_ASYNC> {
    return void 0;
  }

  get fileChangesQueue(): ChangeOfFile[] {
    return [];
  }
}
