import { Helpers, Project } from 'tnp-helpers';
import { TnpDB } from 'tnp-db';

// TODO this will be done with background-worker-process

export async function DAEMON_TEST(args, exit = true) {
  const db = await TnpDB.Instance();
  const projs = await db.getProjects();
  console.log(projs.map(c => c.project.name));
  process.exit(0);
}

export async function DAEMON_KILL(args, exit = true) {
  const db = await TnpDB.Instance();
  // await Helpers.killProcessByPort(await db.getDaemonPort());
  process.exit(0);
}

export async function DAEMON_LISTEN() {
  const db = await TnpDB.Instance();
  db.listenToChannel(Project.Current, 'tnp-copyto-add')
}

export async function DAEMON_TRIGGER() {
  const db = await TnpDB.Instance();
  await db.triggerChangeForProject(Project.Current, 'tnp-copyto-add');
}


export default {
  DAEMON_TEST: Helpers.CLIWRAP(DAEMON_TEST, 'DAEMON_TEST'),
  DAEMON_KILL: Helpers.CLIWRAP(DAEMON_KILL, 'DAEMON_KILL'),
  DAEMON_LISTEN: Helpers.CLIWRAP(DAEMON_LISTEN, 'DAEMON_LISTEN'),
}
