import * as chokidar from 'chokidar';

function AfterAsyncAction(unsub?: (change: ChangeOfFile, target: Function) => any) {
  return function (target: any, m, c) {
    // TODO

    ///
  } as any;
}

@AfterAsyncAction((c, target) => {
  CompilerManager.changeExecuted(c, target);
})
export class BaseClientCompiler<RES_ASYNC = any, RES_SYNC = any> {
  constructor(
    public name: string,
    public folderPath: string,
    public subscribeOnlyFor?: FileExtension[]
  ) {

  }

  public syncAction(syncEvents: ChangeOfFile): Promise<RES_SYNC> {
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




export type ChangeOfFileCloneOptios = {
  onlyForClient?: BaseClientCompiler[];
}

export class ChangeOfFile {

  public clientBy<T = BaseClientCompiler>(fun: Function): T {
    return void 0;
  }
  public clientsForChange: BaseClientCompiler[] = [];
  public clients<C>(clients): { [name in keyof C]: BaseClientCompiler } {
    Object.keys(clients).forEach(key => {
      clients[key] = this.clientBy<C>(clients[key]);
    });
    return void 0;
  };
  public folderPath: string;
  public fileAbsolutePath: string;
  public fileExt: FileExtension;
  public readonly datetime: Date;

  clone(options?: ChangeOfFileCloneOptios): ChangeOfFile {
    return void 0;
  }
}

export type FileExtension = 'ts' | 'js' | 'json' | 'html' | 'jpg' | 'png' | 'txt';

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

  public static addClient(client: BaseClientCompiler) {

  }

  public static async init(
    onAsyncFileChange?: (event: ChangeOfFile, restOfQueue?: ChangeOfFile[]) => Promise<ChangeOfFile>,
    onSyncFilesChange?: (event: ChangeOfFile, restOfQueue?: ChangeOfFile[]) => Promise<ChangeOfFile>) {


    chokidar.watch('', {
      atomic: true,

    }).on('all', (absolutePath) => {

    });
  }

  public static changeExecuted(cange: ChangeOfFile, target: Function) {

  }

  private constructor() {

  }

}

