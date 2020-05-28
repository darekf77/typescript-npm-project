import { Helpers } from 'tnp-helpers';
import { TnpDB } from 'tnp-db';
import { config } from '../../config';


async function BENCH_PROJ_DB() {
  global.hideLog = false;
  const db = await TnpDB.Instance(config.dbLocation);

  await Helpers.mesureExectionInMs('get project from db and stringigy', async () => {
    // global.codePurposeBrowser = true;
    const projects = await db.getProjects();
    // global.codePurposeBrowser = false;
    Helpers.log(`projects length: ${projects.length}`)
  });
  process.exit(0)
}

export default {
  BENCH_PROJ_DB: Helpers.CLIWRAP(BENCH_PROJ_DB, 'BENCH_PROJ_DB'),
}
