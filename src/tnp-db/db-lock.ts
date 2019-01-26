import { runSyncOrAsync } from '../helpers';



export class DBTransaction {


  async start(callback: () => void) {
    console.log('Transaction started')
    await runSyncOrAsync(callback)
    console.log('Transaction ended')
  }



  get transactionInProgress() {
    return false;
  }

}
