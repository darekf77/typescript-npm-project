//#region @backend
import { TnpDBModel } from '../tnp-db';
import { TnpDB } from '../tnp-db/wrapper-db';

export async function $LAST(args: string) {
  const db = await TnpDBModel.Instance();
  await db.start.lastCommand(db.get.lastCommandFrom(process.cwd()));
  process.exit(0)
}

export default {
  $DB: async (args: string) => {
    if (args.trim() === 'reinit') {
      await TnpDB.Instance(true)
    }
    const db = await TnpDBModel.Instance();
    process.exit(0)
  },
  $LAST
}

//#endregion
