import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { watch } from 'chokidar'
import * as glob from 'glob';
import * as _ from "lodash";

import { IObserveFile } from '../../models';
import { runSyncOrAsync } from '../../helpers';

export class ObserveFile implements IObserveFile {
  constructor(data: IObserveFile) {
    Object.keys(data).forEach(key => {
      this[key] = data[key];
    });
  }
  cwd: string;
  folderName: string;
  onlyExtensions?: string[];
  classFn: Function;
  asyncPriority?: number;
  get allFilesRelativePathes() {
    return glob.sync(`${this.folderName}/**/*.*`, { cwd: this.cwd });
  }
  syncAction: (filesRelativePathes: string[]) => any;
  preAsyncAction: (filesRelativePathes: string[]) => any;
  asyncAction: (filesAbsolutePath: string[]) => any;


}

export class FilesObserver {
  private static _instance: FilesObserver;
  public static get Instance() {
    if (this._instance) {
      this._instance = new FilesObserver();
    }
    return this._instance;
  }

  public cwd: string;
  constructor(
  ) { }

  watchRequests: ObserveFile[];
  observe(watchRequests: IObserveFile[]) {
    this.watchRequests = watchRequests.map(wr => new ObserveFile(wr))

  }

  public async initSyncAction(classFn: Function) {
    const wrs = this.watchRequests
      .filter(wr => wr.classFn.name === classFn.name); // TODO maybe by refernce ?

    for (let index = 0; index < wrs.length; index++) {
      const wr = wrs[index];
      await runSyncOrAsync(wr.syncAction, wr.allFilesRelativePathes);
    }
  }

  private handleAsyncFiles() {

  }

  private watch() {
    setTimeout(() => {



      // watch(this.watchDir, {
      //   followSymlinks: false,
      // })
      //   .on('change', callBackWithRelativePath('changed'))
      //   .on('change', callBackWithRelativePath('rename'))
      //   .on('add', callBackWithRelativePath('created'))
      //   .on('unlink', callBackWithRelativePath('removed'))
    });

  }


}
