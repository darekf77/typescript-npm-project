import { Helpers } from 'tnp-helpers';
import { TnpDB } from 'tnp-db';
import { config } from '../../config';


async function BENCH_PROJ_DB() {
  global.hideLog = false;
  const db = await TnpDB.Instance();

  await Helpers.mesureExectionInMs('get project from db and stringigy', async () => {
    // global.codePurposeBrowser = true;
    const projects = await db.getProjects();
    // global.codePurposeBrowser = false;
    Helpers.log(`projects length: ${projects.length}`)
  });
  process.exit(0)
}

export async function BENCH_DAEMON(args, exit = true) {
  const db = await TnpDB.Instance();
  try {
    const projs = await (await db.daemonInstance).allprojects().received;
    console.log(projs);
  } catch (error) {
    console.log(error);
  }
  process.exit(0);
}



export default {
  BENCH_DAEMON: Helpers.CLIWRAP(BENCH_DAEMON, 'BENCH_DAEMON'),
  BENCH_PROJ_DB: Helpers.CLIWRAP(BENCH_PROJ_DB, 'BENCH_PROJ_DB'),
}
