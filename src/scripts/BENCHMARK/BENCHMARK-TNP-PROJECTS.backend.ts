import * as  _ from 'lodash';
import * as TerminalProgressBar from 'progress';
import { Helpers } from 'tnp-helpers';
import { TnpDB } from 'tnp-db';
import { config } from '../../config';


// TODO this will be done with background-worker-process

async function BENCH_PROJ_DB() {
  // global.hideLog = false;
  // const db = await TnpDB.Instance();

  // await Helpers.mesureExectionInMs('get project from db and stringigy', async () => {
  //   // global.codePurposeBrowser = true;
  //   const projects = await db.getProjects();
  //   // global.codePurposeBrowser = false;
  //   Helpers.log(`projects length: ${projects.length}`)
  // });
  process.exit(0)
}

let TEST_LENGTH = 1000;
let TEST_SIZE = 100;
let N = 5;
export async function $BENCHMARK_DB_TEST(args, exit = true) {
  let { size, length } = Helpers.cliTool.argsFrom<{ size: number; length: number; }>(args);
  console.log(`size=${size} length=${length} args: ${args}`)
  size = Number(size);
  length = Number(length);
  TEST_SIZE = (!_.isNaN(size) ? size : TEST_SIZE);
  TEST_LENGTH = (!_.isNaN(length) ? length : TEST_LENGTH);

  const db = await TnpDB.Instance();
  const data = _.times(TEST_SIZE, n => n);
  const prog = new TerminalProgressBar(`Please wait (size=${TEST_SIZE}): :current / :total`, TEST_LENGTH);
  for (let index = 0; index < TEST_LENGTH; index++) {
    prog.tick()
    await db.rawSet('testData', data);
    const d = await db.rawGet('testData');
    await db.rawSet('testData', []);
  }
  prog.terminate();
  process.exit(0);
}

export async function $BENCHMARK_WORKER(args, exit = true) {
  let a = Helpers.cliTool.argsFrom<{ n: number; size: number; length: number; }>(args);
  a.n = Number(a.n);
  N = !_.isNaN(a.n) ? a.n : N;
  a.size = Number(a.size);
  a.length = Number(a.length);
  TEST_SIZE = (!_.isNaN(a.size) ? a.size : TEST_SIZE);
  TEST_LENGTH = (!_.isNaN(a.length) ? a.length : TEST_LENGTH);

  _.times(N, (n) => {
    n++;
    const workerArgs = `--size=${TEST_SIZE / n} --length=${TEST_LENGTH * n} -useWorker=false `;
    Helpers.info(`

    TEST FOR n=${n}

    `)
    Helpers.info(`

    WORKER = false

    `)
    Helpers.run(`time ${config.frameworkName} ${Helpers.cliTool.paramsFromFn($BENCHMARK_DB_TEST)} ${workerArgs}`).sync();
    Helpers.info(Helpers.terminalLine())
    Helpers.info(`

    WORKER = true

    `)
    Helpers.run(`time ${config.frameworkName} ${Helpers.cliTool.paramsFromFn($BENCHMARK_DB_TEST)} ${workerArgs}`).sync();
  });
  process.exit(0);
}



export default {
  $BENCHMARK_WORKER: Helpers.CLIWRAP($BENCHMARK_WORKER, '$BENCHMARK_WORKER'),
  $BENCHMARK_DB_TEST: Helpers.CLIWRAP($BENCHMARK_DB_TEST, '$BENCHMARK_DB_TEST'),
  BENCH_PROJ_DB: Helpers.CLIWRAP(BENCH_PROJ_DB, 'BENCH_PROJ_DB'),
}
