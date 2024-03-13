//#region @backend
import { _, crossPlatformPath } from 'tnp-core/src';
import { Helpers } from 'tnp-helpers/src';
import { Project } from '../../project';
import { PROGRESS_DATA } from 'tnp-models/src';
import { config } from 'tnp-config/src';
import { TestTypeFiredev, TestTypeFiredevArr } from '../../models';


function SHOW_LOOP(c = 0 as any, maximum = Infinity, errExit = false) {
  if (_.isString(c)) {
    var { max = Infinity, err = false } = require('minimist')(c.split(' '));
    maximum = max;
    errExit = err;
    // console.log('max',max)
    // console.log('err',err)
    c = 0
  }
  if (c === maximum) {
    process.exit(errExit ? 1 : 0)
  }
  console.log(`counter: ${c}`)
  setTimeout(() => {
    SHOW_LOOP(++c, maximum, errExit)
  }, 1000)
}

function SHOW_LOOP_MESSAGES(c = 0 as any, maximum = Infinity, errExit = false, throwErr = false) {
  if (_.isString(c)) {
    const obj = require('minimist')(c.split(' '));
    var { max = Infinity, err = false } = obj;
    maximum = _.isNumber(max) ? max : Infinity;
    errExit = err;
    throwErr = obj.throw;
    // console.log('max',max)
    // console.log('err',err)
    c = 0
  }
  if (c === maximum) {
    if (throwErr) {
      throw new Error('Custom error!')
    }
    if (errExit) {
      process.exit(1)
    }
    process.exit(0)
  }
  console.log(`counter: ${c}`)
  PROGRESS_DATA.log({ msg: `counter: ${c}`, value: c * 7 })
  setTimeout(() => {
    SHOW_LOOP_MESSAGES(++c, maximum, errExit, throwErr)
  }, 2000)
}

function $PROCESS_CWD() {
  console.log(crossPlatformPath(process.cwd()));
  process.exit(0)
}



async function testSelectors(watch: boolean, debug: boolean, args: string) {
  const proj = Project.Current as Project;
  if (!proj.isStandaloneProject || proj.typeIsNot('isomorphic-lib')) {
    Helpers.error(`[${config.frameworkName}] tests for organization in progress `, false, true);
  }

  const [possibleTest] = args.split(' ');
  const testType = TestTypeFiredevArr.includes(possibleTest as any) ? possibleTest : void 0;
  const res = testType ? testType
    : await Helpers.consoleGui.select<TestTypeFiredev>(`What do you want to test ? ${!watch
      ? '(single run '
      : '(watch mode '
      } ${debug ? '- with debugger connected' : '- without debugger'})`,
      [
        { name: 'Mocha (backend tests from /src/tests/**/*.test.ts)', value: 'mocha' },
        { name: 'Jest (angular unit/integration tests from /src/**/*.spec.ts )   ', value: 'jest' },
        { name: 'Cypress (e2e tests from /src/app//**/*.e2e.ts )', value: 'cypress' },
      ]);
  if (testType) {
    args = args.split(' ').slice(1).join(' ');
  }

  if (res === 'mocha') {
    await mochaTests(watch, debug, args);
  } else if (res === 'jest') {
    await jestTests(watch, debug, args);
  } else if (res === 'cypress') {
    await cypressTests(watch, debug, args);
  } else {
    process.exit(0)
  }
}

async function mochaTests(watch: boolean, debug: boolean, args: string) {
  const proj = Project.Current;
  await proj.filesStructure.init(args);
  if (watch) {
    await Project.Current.tests.startAndWatch(args.trim().split(' '), debug)
  } else {
    await Project.Current.tests.start(args.trim().split(' '), debug)
  }
  if (!watch) {
    process.exit(0)
  }
}


async function jestTests(watch: boolean, debug: boolean, args: string) {
  const proj = Project.Current;
  await proj.filesStructure.init(args);
  if (watch) {
    await proj.testsJest.startAndWatch(debug, args.trim())
  } else {
    await proj.testsJest.start(debug, args.trim())
  }
  if (!watch) {
    process.exit(0)
  }
}


async function cypressTests(watch: boolean, debug: boolean, args: string) {
  const proj = Project.Current;
  await proj.filesStructure.init(args);
  if (watch) {
    await proj.testsCypress.startAndWatch(args.trim().split(' '), debug)
  } else {
    await proj.testsCypress.start(args.trim().split(' '), debug)
  }
  if (!watch) {
    process.exit(0)
  }
}


const $TEST_WATCH = async (args: string) => {
  await testSelectors(true, false, args);
}

const $TEST_WATCH_DEBUG = async (args: string) => {
  await testSelectors(true, true, args);
}

const $TEST = async (args: string) => {
  await testSelectors(false, false, args);
}

const $TEST_DEBUG = async (args: string) => {
  await testSelectors(false, true, args);
}


const $MOCHA_WATCH = async (args: string) => {
  await mochaTests(true, false, args);
}

const $MOCHA_WATCH_DEBUG = async (args: string) => {
  await mochaTests(true, true, args);
}

const $MOCHA = async (args: string) => {
  await mochaTests(false, false, args);
}

const $MOCHA_DEBUG = async (args: string) => {
  await mochaTests(false, true, args);
}


const $JEST_WATCH = async (args: string) => {
  await jestTests(true, false, args);
}

const $JEST_WATCH_DEBUG = async (args: string) => {
  await jestTests(true, true, args);
}

const $JEST = async (args: string) => {
  await jestTests(false, false, args);
}

const $JEST_DEBUG = async (args: string) => {
  await jestTests(false, true, args);
}



const $READLAST = async (args) => {
  // global.tnpShowProgress = true;
  const argsObj: { lines: number; file: string } = require('minimist')(args.split(' '));
  const { lines = 100, file = '' } = argsObj;

  const res = await Helpers.getLinesFromFiles(argsObj.file, Number(argsObj.lines));
  console.log('lines', res);
  process.exit(0)
}

const TEST_ASYNC_PROC = async (args) => {
  global.tnpShowProgress = true;
  let p = Helpers.run(`${config.frameworkName} show:loop ${args}`, { output: false, cwd: process.cwd() }).async()
  p.stdout.on('data', (chunk) => {
    console.log('prod:' + chunk)
  })
  p.on('exit', (c) => {
    console.log('process exited with code: ' + c)
    process.exit(0)
  })
}


const TEST_SYNC_PROC = async (args) => {
  global.tnpShowProgress = true;
  try {
    let p = Helpers.run(`${config.frameworkName} show:loop ${args}`, { output: false, cwd: process.cwd() }).sync()
    process.exit(0)
  } catch (err) {
    console.log('Erroroejk')
    process.exit(1)
  }
}


function $SHOW_LOOP(args) {
  global.tnpShowProgress = true;
  // console.log('process pid', process.pid)
  // console.log('process ppid', process.ppid)
  // process.on('SIGTERM', () => {
  //   process.exit(0)
  // })
  SHOW_LOOP(args)
}

function $SHOW_LOOP_MESSAGES(args) {
  global.tnpShowProgress = true;
  console.log('process pid', process.pid)
  console.log('process ppid', process.ppid)
  // process.on('SIGTERM', () => {
  //   process.exit(0)
  // })
  SHOW_LOOP_MESSAGES(args)
}

function $SHOW_RANDOM_HAMSTERS() {
  while (true) {
    const arr = ['Pluszla', 'Łapczuch', 'Misia', 'Chrupka']
    console.log(arr[Helpers.numbers.randomInteger(0, arr.length - 1)]);
    Helpers.sleep(1);
  }
}

function $SHOW_RANDOM_HAMSTERS_TYPES() {
  while (true) {
    const arr = [
      'djungarian',
      'syrian golden',
      'syrian teddy bear',
      'dwarf roborowski',
      'dwarf russian',
      'dwarf winter white',
      'chinese hamster'
    ]
    console.log(arr[Helpers.numbers.randomInteger(0, arr.length - 1)]);
    Helpers.sleep(1);
  }
}

export default {
  $SHOW_RANDOM_HAMSTERS: Helpers.CLIWRAP($SHOW_RANDOM_HAMSTERS, '$SHOW_RANDOM_HAMSTERS'),
  $SHOW_RANDOM_HAMSTERS_TYPES: Helpers.CLIWRAP($SHOW_RANDOM_HAMSTERS_TYPES, '$SHOW_RANDOM_HAMSTERS_TYPES'),
  $PROCESS_CWD: Helpers.CLIWRAP($PROCESS_CWD, '$PROCESS_CWD'),
  $MOCHA_WATCH: Helpers.CLIWRAP($MOCHA_WATCH, '$MOCHA_WATCH'),
  $MOCHA_WATCH_DEBUG: Helpers.CLIWRAP($MOCHA_WATCH_DEBUG, '$MOCHA_WATCH_DEBUG'),
  $MOCHA: Helpers.CLIWRAP($MOCHA, '$MOCHA'),
  $MOCHA_DEBUG: Helpers.CLIWRAP($MOCHA_DEBUG, '$MOCHA_DEBUG'),
  $JEST_WATCH: Helpers.CLIWRAP($JEST_WATCH, '$JEST_WATCH'),
  $JEST_WATCH_DEBUG: Helpers.CLIWRAP($JEST_WATCH_DEBUG, '$JEST_WATCH_DEBUG'),
  $JEST: Helpers.CLIWRAP($JEST, '$JEST'),
  $JEST_DEBUG: Helpers.CLIWRAP($JEST_DEBUG, '$JEST_DEBUG'),
  $TEST_WATCH: Helpers.CLIWRAP($TEST_WATCH, '$TEST_WATCH'),
  $TEST_WATCH_DEBUG: Helpers.CLIWRAP($TEST_WATCH_DEBUG, '$TEST_WATCH_DEBUG'),
  $TEST: Helpers.CLIWRAP($TEST, '$TEST'),
  $TEST_DEBUG: Helpers.CLIWRAP($TEST_DEBUG, '$TEST_DEBUG'),
  $READLAST: Helpers.CLIWRAP($READLAST, '$READLAST'),
  TEST_ASYNC_PROC: Helpers.CLIWRAP(TEST_ASYNC_PROC, 'TEST_ASYNC_PROC'),
  TEST_SYNC_PROC: Helpers.CLIWRAP(TEST_SYNC_PROC, 'TEST_SYNC_PROC'),
  $SHOW_LOOP: Helpers.CLIWRAP($SHOW_LOOP, '$SHOW_LOOP'),
  $SHOW_LOOP_MESSAGES: Helpers.CLIWRAP($SHOW_LOOP_MESSAGES, '$SHOW_LOOP_MESSAGES'),
}
//#endregion
