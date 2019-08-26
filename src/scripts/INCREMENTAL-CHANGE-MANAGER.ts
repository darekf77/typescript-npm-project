//#region @backend
import * as path from 'path';
import { CLASS } from 'typescript-class-helpers';
import { IncCompiler } from '../project/abstract/incremental-compiler';
import { log } from '../helpers/helpers-messages';


IncCompiler.init(async (asyncEvents) => {
  const { clients } = asyncEvents;
  const customClientActions = {
    ClientCompiler1: CLASS.getSingleton<IClientCompiler1>(CLASS.getBy('ClientCompiler1')),
    ClientCompiler2: CLASS.getSingleton<IClientCompiler2>(CLASS.getBy('ClientCompiler2'))
  };
  const c = clients<typeof customClientActions>(customClientActions);
  // @LAST make it work
  c.ClientCompiler1.asyncAction(asyncEvents, 'This is amaizing');
  return asyncEvents;
});


@IncCompiler.Class({ className: 'ClientCompiler1' })
export class ClientCompiler1 extends IncCompiler.Base<{ dupa: boolean; }> {

  async syncAction(files) {
    // console.log(`sync Files for ${CLASS.getNameFromObject(this)}`, files)
  }

  @IncCompiler.AsyncAction()
  asyncAction(change: IncCompiler.Change, data) {
    console.log(`Async action ${CLASS.getNameFromObject(this)}, data: ${data}`)
    return new Promise<any>((resolve) => {
      // console.log(`async start for ${CLASS.getNameFromObject(this)}`, change.fileAbsolutePath)
      setTimeout(() => {
        // console.log(`async end for ${CLASS.getNameFromObject(this)}`, change.fileAbsolutePath)
        resolve();
      }, 2000)
    })
  }

}

export type IClientCompiler1 = ClientCompiler1;

@IncCompiler.Class({ className: 'ClientCompiler2' })
export class ClientCompiler2 extends IncCompiler.Base {
  async syncAction(files) {
    // console.log(`sync Files for ${CLASS.getNameFromObject(this)}`, files)
  }

  @IncCompiler.AsyncAction()
  asyncAction(change: IncCompiler.Change, data) {
    console.log(`Async action ${CLASS.getNameFromObject(this)}, data: ${data}`)
    return new Promise<any>((resolve) => {
      // console.log(`async start for ${CLASS.getNameFromObject(this)}`, change.fileAbsolutePath)
      setTimeout(() => {
        // console.log(`async end for ${CLASS.getNameFromObject(this)}`, change.fileAbsolutePath)
        resolve();
      }, 2000);
    });
  }
}
export type IClientCompiler2 = ClientCompiler2;

export default {


  async COMPILER() {
    const c1 = new ClientCompiler1({
      folderPath: path.join(process.cwd(), 'tmp-test1')
    });
    const c2 = new ClientCompiler2({
      folderPath: path.join(process.cwd(), 'tmp-test1')
    });
    IncCompiler.Add(c1);
    IncCompiler.Add(c2);
    c1.initAndWatch();
    c2.initAndWatch();
  }

}

//#endregion
