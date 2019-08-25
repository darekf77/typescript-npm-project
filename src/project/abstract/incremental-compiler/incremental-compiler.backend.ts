import * as chokidar from 'chokidar';
import * as path from 'path';
import * as _ from 'lodash';
import * as glob from 'glob';
import * as fse from 'fs-extra';
import { CLASS } from 'typescript-class-helpers';
import { error, warn, log } from '../../../helpers/helpers-messages';
import { ChangeOfFile } from './change-of-file.backend';
import { BaseClientCompiler } from './base-client-compiler.backend';
import { FileExtension } from '../../../models';
import { patchingForAsync } from '../../../helpers';


export class CompilerManager {
  //#region singleton
  private static _instance: CompilerManager;
  public static get Instance() {
    if (!this._instance) {
      this._instance = new CompilerManager();
    }
    return this._instance;
  }
  //#endregion

  private clients: BaseClientCompiler[] = [];
  public addClient(client: BaseClientCompiler) {
    const existed = this.clients.find(c => CLASS.getNameFromObject(c) === CLASS.getNameFromObject(client));
    if (existed) {
      error(`Client "${CLASS.getNameFromObject(client)}" alread added`, false, true);
    }
    this.clients.push(client);
  }

  private asyncEventScenario: (event: ChangeOfFile) => Promise<ChangeOfFile>;

  public async init(
    onAsyncFileChange?: (event: ChangeOfFile) => Promise<ChangeOfFile>) {
    this.asyncEventScenario = onAsyncFileChange;
  }

  public changeExecuted(cange: ChangeOfFile, target: Function) {

  }

  private get allFoldersToWatch() {
    const folders: string[] = [];
    this.clients.forEach(c => {
      if (_.isString(c.folderPath) && !folders.includes(c.folderPath)) {
        folders.push(c.folderPath);
      }
    });
    return folders;
  }
  private currentObservedFolder = [];

  syncActionResolvedFiles(client: BaseClientCompiler) {
    if (client.folderPath) {
      return glob.sync(`${client.folderPath}/**/*.*`, {
        symlinks: false,
      }).filter(f => {
        if (client.subscribeOnlyFor.length > 0) {
          return client.subscribeOnlyFor.includes(path.extname(f).replace('.', '') as FileExtension);
        }
        return true;
      })
    }
    return [];
  }

  public async syncInit(client: BaseClientCompiler) {
    log(`syncInit of ${CLASS.getNameFromObject(client)}`);
    await client.syncAction(this.syncActionResolvedFiles(client));
  }

  private watcher: chokidar.FSWatcher;
  public async asyncInit(client: BaseClientCompiler) {
    log(`asyncInit of ${CLASS.getNameFromObject(client)}`);
    await this.syncInit(client);

    if (this.currentObservedFolder.length === 0 && this.allFoldersToWatch.length > 0) {
      this.watcher = chokidar.watch(this.allFoldersToWatch, {
        ignoreInitial: true,
        followSymlinks: true,
        ignorePermissionErrors: true,
        // @LAST before client without watch and using async in init()
      }).on('all', async (event, f) => {
        if (event !== 'addDir') {

          log(`event ${event}, path: ${f}`);
          const toNotify = this.clients
            .filter(c => f.startsWith(c.folderPath));

          const change = new ChangeOfFile();
          change.clientsForChange = toNotify;
          change.fileAbsolutePath = f;
          if (this.asyncEventScenario) {
            await this.asyncEventScenario(change);
          }
          for (let index = 0; index < toNotify.length; index++) {
            const c = toNotify[index];
            await c.asyncAction(change);
          }
        }
      });
    } else if (_.isString(client.folderPath) && !this.currentObservedFolder.includes(client.folderPath)) {
      this.watcher.add(client.folderPath);
    }
  }

  private constructor() {

  }

}

