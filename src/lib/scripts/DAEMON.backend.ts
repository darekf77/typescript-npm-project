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
  await db.killWorker();
  process.exit(0);
}

async function KILL_DAEMON(args) {
  await DAEMON_KILL(args);
}

export async function DAEMON_LISTEN() {
  const db = await TnpDB.Instance();
  db.listenToChannel(Project.Current, 'tnp-copyto-add', () => { });
  db.listenToChannel(Project.Current, 'tnp-copyto-remove', () => { });
}

export async function DAEMON_TRIGGER_ADD() {
  const db = await TnpDB.Instance();
  await db.triggerChangeForProject(Project.Current, 'tnp-copyto-add');
  process.exit(0);
}

export async function DAEMON_TRIGGER_REMOVE() {
  const db = await TnpDB.Instance();
  await db.triggerChangeForProject(Project.Current, 'tnp-copyto-remove');
  process.exit(0);
}


export default {
  DAEMON_TEST: Helpers.CLIWRAP(DAEMON_TEST, 'DAEMON_TEST'),
  DAEMON_KILL: Helpers.CLIWRAP(DAEMON_KILL, 'DAEMON_KILL'),
  KILL_DAEMON: Helpers.CLIWRAP(KILL_DAEMON, 'KILL_DAEMON'),
  DAEMON_LISTEN: Helpers.CLIWRAP(DAEMON_LISTEN, 'DAEMON_LISTEN'),
  // DAEMON_TRIGGER: Helpers.CLIWRAP(DAEMON_TRIGGER, 'DAEMON_TRIGGER'),
  DAEMON_TRIGGER_ADD: Helpers.CLIWRAP(DAEMON_TRIGGER_ADD, 'DAEMON_TRIGGER_ADD'),
  DAEMON_TRIGGER_REMOVE: Helpers.CLIWRAP(DAEMON_TRIGGER_REMOVE, 'DAEMON_TRIGGER_REMOVE'),
}
