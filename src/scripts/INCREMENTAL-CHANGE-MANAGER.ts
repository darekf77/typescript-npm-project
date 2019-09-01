//#region @backend
import * as path from 'path';
import { CLASS } from 'typescript-class-helpers';
import { IncCompiler } from 'incremental-compiler';
import { Helpers } from '../helpers';

IncCompiler.init(async (asyncEvents) => {

  const customClientActions = {
    ClientCompiler1: CLASS.getSingleton<IClientCompiler1>(ClientCompiler1),
    ClientCompiler2: CLASS.getSingleton<IClientCompiler2>(ClientCompiler2),
  };

  const c = asyncEvents.clients<typeof customClientActions>(customClientActions);

  // c.ClientCompiler1.asyncAction(asyncEvents, 'This is amaizing');

}, {
    info: Helpers.info,
    error: Helpers.error,
    warn: Helpers.warn,
    log: Helpers.log,
    runSyncOrAsync: Helpers.runSyncOrAsync,
    compilationWrapper: Helpers.compilationWrapperTnp
  });


@IncCompiler.Class({ className: 'ClientCompiler1' })
export class ClientCompiler1 extends IncCompiler.Base<{ dupa: boolean; }> {

  async syncAction(files) {
    // console.log(`sync Files for ${CLASS.getNameFromObject(this)}`, files)
  }

  @IncCompiler.methods.AsyncAction()
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

  @IncCompiler.methods.AsyncAction()
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
    const c1 = await CLASS
      .getSingleton<ClientCompiler1>(ClientCompiler1)
      .set({ folderPath: path.join(process.cwd(), 'tmp-test1') })
      .startAndWatch();

    const c2 = await CLASS
      .getSingleton<IClientCompiler2>(ClientCompiler2)
      .set({ folderPath: path.join(process.cwd(), 'tmp-test1'), executeOutsideScenario: false })
      .startAndWatch();
  }

}

//#endregion
