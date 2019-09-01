//#region @backend
import * as  psList from 'ps-list';
import { TnpDB } from '../tnp-db/wrapper-db';
import { CommandInstance } from '../tnp-db/entites';
import { Models } from '../models';

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

async function $EXISTS(args: string) {
  const pid = Number(args.trim())
  const ps: Models.system.PsListInfo[] = await psList();
  console.log(`process.pid: ${process.pid}`)
  console.log(`pid to check: ${pid}`)
  console.log(!!ps.find(p => p.pid === pid))
  process.exit(0)
}

export default {
  $DB,
  $DB_REINTI() {
    return $DB('reinit')
  },
  $LAST,
  $EXISTS
}

//#endregion
