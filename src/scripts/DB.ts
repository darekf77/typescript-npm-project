//#region @backend
import { TnpDB } from '../tnp-db/wrapper-db';

export async function $LAST(args: string) {
  const db = await TnpDB.Instance;
  await db.commands.runCommand(db.commands.lastCommandFrom(process.cwd()));
  process.exit(0)
}

export default {
  $DB: async (args: string) => {
    const db = await TnpDB.Instance;
    if (args.trim() === 'reinit') {
      await db.init()
    }
    process.exit(0)
  },
  $LAST
}

//#endregion
