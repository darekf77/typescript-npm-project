//#region @backend
import { TnpDB } from '../tnp-db/wrapper-db';
import { CommandInstance } from '../tnp-db/entites';

export async function $LAST(args: string) {
  const db = await TnpDB.Instance;
  const last = db.lastCommandFrom(process.cwd());
  // console.log('last commadn to run', last)
  await db.runCommand(!!last ? last : new CommandInstance(undefined, process.cwd()));
  // process.exit(0)
}

const $DB = async (args: string) => {
  const db = await TnpDB.Instance;

  if (args.trim() === 'reinit') {
    await db.init()
    db.transaction.setCommand('tnp db reinit')
  } else {
    db.transaction.setCommand('tnp db')
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
