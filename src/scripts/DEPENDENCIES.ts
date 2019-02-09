
//#region @backend
import * as _ from 'lodash';
import { Project} from '../project';
import { error, info } from '../messages';
import { commitWhatIs } from '../helpers-git';

export default {

  $DEPS_CORE() {
    Project.Current.packageJson.coreRecreate()
    process.exit(0)
  },


  $DEDUPE() {
    Project.Current.packageJson.dedupe()
    process.exit(0)
  },

  $DEPS_DEDUPE(args: string) {
    Project.Current.packageJson.dedupe()
    process.exit(0)
  },

  $DEPS_RECREATE(args: string) {
    Project.Current.packageJson.saveForInstall(true)
    process.exit(0)
  },

  DEPS_SHOW(args: string) {
    Project.Current.packageJson.saveForInstall(true)
    process.exit(0)
  },

  DEPS_SHOW_IF_STANDALONE(args: string) {
    if (Project.Current.isStandaloneProject) {
      info(`Showing deps for standalone project`)
      Project.Current.packageJson.saveForInstall(true)
    }
    commitWhatIs(`show package.json dependencies`)
    process.exit(0)
  },


  $DEPS_CLEAN(args: string) {
    Project.Current.packageJson.saveForInstall(false)
    process.exit(0)
  },

  $DEPS_HIDE(args: string) {
    Project.Current.packageJson.saveForInstall(false)
    process.exit(0)
  },


}


//#endregion
