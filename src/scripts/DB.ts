//#region @backend
import { TnpDB } from '../tnp-db/wrapper-db';
import { CommandInstance } from '../tnp-db/command-instance';

export async function $LAST(args: string) {
  const db = await TnpDB.Instance;
  const last = db.commands.lastCommandFrom(process.cwd());
  await db.commands.runCommand(!!last ? last : new CommandInstance(undefined, process.cwd()));
  // process.exit(0)
}

const $DB = async (args: string) => {
  const db = await TnpDB.Instance;

  if (args.trim() === 'reinit') {
    await db.init()
    db.commands.setCommand(process.cwd(), 'tnp db reinit')
  } else {
    db.commands.setCommand(process.cwd(), 'tnp db')
  }

  process.exit(0)
}

export default {
  $DB,
  $DB_REINTI() {
    return $DB('reinit')
  },
  $LAST
}

//#endregion
