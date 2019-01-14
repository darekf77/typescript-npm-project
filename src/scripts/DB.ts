//#region @backend
import { TnpDBModel } from '../tnp-db';
import { TnpDB } from '../tnp-db/wrapper-db';



export default {
  $DB: async (args: string) => {
    if (args.trim() === 'reinit') {
      await TnpDB.Instance(true)
    }
    const db = await TnpDBModel.Instance();
    console.log(db.builds)
    process.exit(0)
  }
}

//#endregion
