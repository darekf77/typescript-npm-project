//#region @backend
import { getLinesFromFiles } from "../helpers";
import { Project } from '../project';
import { init } from './INIT';


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
  }

}
//#endregion
