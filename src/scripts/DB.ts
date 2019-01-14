//#region @backend
import { TnpDBModel } from '../tnp-db';



export default {
  $DB: async (args: string) => {
    const db = await TnpDBModel.Instance(args.trim() === 'reinit');
    console.log(db.builds)
    process.exit(0)
  }
}

//#endregion
