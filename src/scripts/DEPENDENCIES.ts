
//#region @backend
import * as _ from 'lodash';
import { Project } from '../project';
import { error, info } from '../helpers';
import { commitWhatIs } from '../helpers';

function DEPS_SHOW(args: string) {
  Project.Current.packageJson.show('deps show')
  process.exit(0)
}

function DEPS_HIDE(args: string) {
  Project.Current.packageJson.hide('deps hide')
  process.exit(0)
}

export default {

  $DEPS_CORE() {
    Project.Current.packageJson.coreRecreate()
    process.exit(0)
  },

  $DEDUPE(args: string) {
    Project.Current.packageJson.dedupe(args.split(' '))
    process.exit(0)
  },

  $DEPS_DEDUPE(args: string) {
    Project.Current.packageJson.dedupe()
    process.exit(0)
  },

  DEPS_SHOW,
  $DEPS_RECREATE(args: string) {
    DEPS_SHOW(args)
  },

  DEPS_SHOW_IF_STANDALONE(args: string) {
    if (Project.Current.isStandaloneProject) {
      info(`Showing deps for standalone project`)
      Project.Current.packageJson.show('is standalone show')
    }
    commitWhatIs(`show package.json dependencies`)
    process.exit(0)
  },

  DEPS_HIDE,
  $DEPS_CLEAN(args: string) {
    DEPS_HIDE(args)
  },




}


//#endregion
