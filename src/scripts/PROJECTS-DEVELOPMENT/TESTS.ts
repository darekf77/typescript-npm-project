//#region @backend
import { _ } from 'tnp-core';
import { Helpers } from 'tnp-helpers';
import { Project } from '../../project';
import { PROGRESS_DATA } from 'tnp-models';


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

function SHOW_LOOP_MESSAGES(c = 0 as any, maximum = Infinity, errExit = false) {
  if (_.isString(c)) {
    var { max = Infinity, err = false } = require('minimist')(c.split(' '));
    maximum = _.isNumber(max) ? max : Infinity;
    errExit = err;
    // console.log('max',max)
    // console.log('err',err)
    c = 0
  }
  if (c === maximum) {
    process.exit(errExit ? 1 : 0)
  }
  PROGRESS_DATA.log({ msg: `counter: ${c}`, value: c * 7 })
  setTimeout(() => {
    SHOW_LOOP_MESSAGES(++c, maximum, errExit)
  }, 3000)
}

function $PROCESS_CWD() {
  console.log(process.cwd());
  process.exit(0)
}

const $TEST_WATCH = async (args: string) => {
  await (Project.Current as Project).filesStructure.init(args);
  await (Project.Current as Project).tests.startAndWatch(args.trim().split(' '))
}

const $TEST_WATCH_DEBUG = async (args: string) => {
  await (Project.Current as Project).filesStructure.init(args);
  await (Project.Current as Project).tests.startAndWatch(args.trim().split(' '), true)
}

const $TEST = async (args: string) => {
  await (Project.Current as Project).filesStructure.init(args);
  await (Project.Current as Project).tests.start(args.trim().split(' '))
  process.exit(0)
}

const $TEST_DEBUG = async (args: string) => {
  await (Project.Current as Project).filesStructure.init(args);
  await (Project.Current as Project).tests.start(args.trim().split(' '), false, true)
  process.exit(0)
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
  let p = Helpers.run(`tnp show:loop ${args}`, { output: false, cwd: process.cwd() }).async()
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
    let p = Helpers.run(`tnp show:loop ${args}`, { output: false, cwd: process.cwd() }).sync()
    process.exit(0)
  } catch (err) {
    console.log('Erroroejk')
    process.exit(1)
  }
}


function $SHOW_LOOP(args) {
  global.tnpShowProgress = true;
  console.log('process pid', process.pid)
  console.log('process ppid', process.ppid)
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

export default {
  $PROCESS_CWD: Helpers.CLIWRAP($PROCESS_CWD, '$PROCESS_CWD'),
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
