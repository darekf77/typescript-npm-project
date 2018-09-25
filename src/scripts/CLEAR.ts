//#region @backend
import * as _ from 'lodash';
import { LibType, BuildDir } from '../models';

import { Project } from '../project';
import { clearConsole } from '../process';

export function clear(args, all = false) {
  let { onlyWorkspace } = require('minimist')(args.split(' '));
  // console.log('onlyWorkspace', onlyWorkspace)

  clearConsole()
  Project.Current.clear(all,onlyWorkspace)
  process.exit(0)
}

export default {
  $CLEAN: (args) => clear(args),
  $CLEAR: (args) => clear(args),
  $CLEAN_ALL: (args) => clear(args, true),
  $CLEAR_ALL: (args) => clear(args, true)
}
//#endregion
