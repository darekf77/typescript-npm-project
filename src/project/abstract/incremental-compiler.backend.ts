
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


export class ClientCompiler1 extends BaseClientCompiler<{ dupa: boolean; }> {

}

export class ClientCompiler2 extends BaseClientCompiler {

}

export class ChangeOfFile {

  public clientBy<T = BaseClientCompiler>(fun: Function): T {
    return void 0;
  }
  public clientsForChange: BaseClientCompiler[] = [];
  public clients<C>(clients): { [name in keyof C]: BaseClientCompiler } {
    Object.keys(clients).forEach(key => {
      clients[key] = this.clientBy<ClientCompiler1>(clients[key]);
    });
    return void 0;
  };
  public folderPath: string;
  public fileAbsolutePath: string;
  public fileExt: FileExtension;
  public readonly datetime: Date;
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
    onAsyncFileChange?: (event: ChangeOfFile) => Promise<ChangeOfFile>,
    onSyncFilesChange?: (event: ChangeOfFile) => Promise<ChangeOfFile>) {

  }

  public static changeExecuted(cange: ChangeOfFile, target: Function) {

  }

  private constructor() {

  }

}
CompilerManager.init(async asyncEvents => {
  const { clientsForChange, clientBy, clients } = asyncEvents;
  const customClientActions = {
    ClientCompiler1,
    ClientCompiler2
  };
  const c = clients<typeof customClientActions>(customClientActions);




  if ((await c.ClientCompiler1.asyncAction(asyncEvents)).dupa) {

  }

  return asyncEvents;
})
