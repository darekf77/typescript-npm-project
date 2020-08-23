import { Helpers } from 'tnp-helpers';
import { TnpDB } from 'tnp-db';

// TODO this will be done with background-worker-process

export async function DAEMON_TEST(args, exit = true) {
  const db = await TnpDB.Instance();
  // await db.DaemonTest()
  process.exit(0);
}

export async function DAEMON_KILL(args, exit = true) {
  const db = await TnpDB.Instance();
  // await Helpers.killProcessByPort(await db.getDaemonPort());
  process.exit(0);
}



export default {
  DAEMON_TEST: Helpers.CLIWRAP(DAEMON_TEST, 'DAEMON_TEST'),
  DAEMON_KILL: Helpers.CLIWRAP(DAEMON_KILL, 'DAEMON_KILL'),
}
