// //#region @backend
// import { path } from 'tnp-core'
// import { CLASS } from 'typescript-class-helpers';
// import { IncCompiler } from 'incremental-compiler';
// import { Helpers } from 'tnp-helpers';
// import { Project } from '../../project';

// IncCompiler.init(async (asyncEvents) => {

//   // asyncEvents.clientsBy(ClientCompiler1)
//   // const clients1 = asyncEvents.clientsBy<ClientCompiler1>(ClientCompiler1);
//   // // console.log('clients1',clients1)
//   // for (let index = 0; index < clients1.length; index++) {
//   //   const c = clients1[index];
//   //   await c.asyncAction(asyncEvents, 'This is amaizing');
//   // }

// }, Helpers as any);

// @IncCompiler.Class({ className: 'ClientCompiler1' })
// export class ClientCompiler1 extends IncCompiler.Base<{ dupa: boolean; }> {

//   public project: Project;
//   async syncAction(files) {
//     // console.log(`sync Files for ${CLASS.getNameFromObject(this)}`, files)
//   }

//   @IncCompiler.methods.AsyncAction()
//   asyncAction(change: IncCompiler.Change, data) {
//     console.log(`Async action ${CLASS.getNameFromObject(this)}, data: ${data}`)
//     return new Promise<any>((resolve) => {
//       // console.log(`async start for ${CLASS.getNameFromObject(this)}`, change.fileAbsolutePath)
//       setTimeout(() => {
//         // console.log(`async end for ${CLASS.getNameFromObject(this)}`, change.fileAbsolutePath)
//         resolve();
//       }, 2000)
//     })
//   }

// }

// export type IClientCompiler1 = ClientCompiler1;

// @IncCompiler.Class({ className: 'ClientCompiler2' })
// export class ClientCompiler2 extends IncCompiler.Base {
//   async syncAction(files) {
//     // console.log(`sync Files for ${CLASS.getNameFromObject(this)}`, files)
//   }

//   @IncCompiler.methods.AsyncAction()
//   asyncAction(change: IncCompiler.Change, data) {
//     console.log(`Async action ${CLASS.getNameFromObject(this)}, data: ${data}`)
//     return new Promise<any>((resolve) => {
//       // console.log(`async start for ${CLASS.getNameFromObject(this)}`, change.fileAbsolutePath)
//       setTimeout(() => {
//         // console.log(`async end for ${CLASS.getNameFromObject(this)}`, change.fileAbsolutePath)
//         resolve();
//       }, 2000);
//     });
//   }
// }
// export type IClientCompiler2 = ClientCompiler2;

// export default {


//   async COMPILER() {
//     const c1 = await (new ClientCompiler1())
//       .set({ folderPath: path.join(crossPlatformPath(process.cwd()), 'tmp-test1') })
//       .startAndWatch();

//     const c2 = await (new ClientCompiler1())
//       .set({ folderPath: path.join(crossPlatformPath(process.cwd()), 'tmp-test1'), executeOutsideScenario: false })
//       .startAndWatch();
//   }

// }

// //#endregion
