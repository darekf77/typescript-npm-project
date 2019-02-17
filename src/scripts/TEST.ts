//#region @backend
import * as _ from 'lodash';
import { getLinesFromFiles } from "../helpers";
import { Project } from '../project';
import { init } from './INIT';
import { run } from '../process';

function SHOW_LOOP(c = 0, maximum = Infinity, errExit = false) {
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

export default {

  $TEST_WATCH: async (args) => {
    await init(args).watch.project(Project.Current)
    await Project.Current.tests.startAndWatch()
    process.exit(0)
  },

  $TEST: async (args) => {
    await init(args).project(Project.Current)
    Project.Current.tests.start()
    process.exit(0)
  },


  $READLAST: async (args) => {

    const argsObj: { lines: number; file: string } = require('minimist')(args.split(' '));
    const { lines = 100, file = '' } = argsObj;

    const res = await getLinesFromFiles(argsObj.file, Number(argsObj.lines));
    console.log('lines', res);
    process.exit(0)
  },

  TEST_ASYNC_PROC: async (args) => {
    let p = run(`tnp show:loop ${args}`, { output: false, cwd: process.cwd() }).async()
    p.stdout.on('data', (chunk) => {
      console.log('prod:' + chunk)
    })
    p.on('exit',(c)=> {
      console.log('process exited with code: '+ c)
      process.exit(0)
    })
  },


  TEST_SYNC_PROC: async (args) => {
    try {
      let p = run(`tnp show:loop ${args}`, { output: false, cwd: process.cwd() }).sync()
      process.exit(0)
    } catch (err) {
      console.log('Erroroejk')
      process.exit(1)
    }
  },

  SHOW_LOOP

}
//#endregion
