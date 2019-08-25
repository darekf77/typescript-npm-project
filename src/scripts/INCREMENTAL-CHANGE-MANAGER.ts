//#region @backend
import * as path from 'path';
import { CLASS } from 'typescript-class-helpers';
import { BaseClientCompiler, CompilerManager, ChangeOfFile } from '../project/abstract/incremental-compiler';
import { log } from '../helpers/helpers-messages';

@CLASS.NAME('ClientCompiler1')
export class ClientCompiler1 extends BaseClientCompiler<{ dupa: boolean; }> {

  async syncAction(files) {
    console.log(`sync Files for ${CLASS.getNameFromObject(this)}`, files)
  }

  asyncAction(change: ChangeOfFile) {
    return new Promise<any>((resolve) => {
      console.log(`async start for ${CLASS.getNameFromObject(this)}`, change.fileAbsolutePath)
      setTimeout(() => {
        console.log(`async end for ${CLASS.getNameFromObject(this)}`, change.fileAbsolutePath)
        resolve();
      }, 1000)
    })
  }

}

export type IClientCompiler1 = ClientCompiler1;

@CLASS.NAME('ClientCompiler2')
export class ClientCompiler2 extends BaseClientCompiler {
  async syncAction(files) {
    console.log(`sync Files for ${CLASS.getNameFromObject(this)}`, files)
  }

  asyncAction(change: ChangeOfFile) {
    return new Promise<any>((resolve) => {
      console.log(`async start for ${CLASS.getNameFromObject(this)}`, change.fileAbsolutePath)
      setTimeout(() => {
        console.log(`async end for ${CLASS.getNameFromObject(this)}`, change.fileAbsolutePath)
        resolve();
      }, 1000)
    })
  }
}
export type IClientCompiler2 = ClientCompiler2;

export default {


  async COMPILER() {
    const c1 = new ClientCompiler1(path.join(process.cwd(), 'tmp-test1'));
    const c2 = new ClientCompiler2(path.join(process.cwd(), 'tmp-test2'));
    CompilerManager.Instance.addClient(c1)
    CompilerManager.Instance.addClient(c2)
    c1.initAndWatch()
    c2.initAndWatch()
  }

}

//#endregion
