//#region @backend
import { Project } from '../project/base-project';

export default {

  $MOD: () => {
    Project.Current.sourceModifier.init()
    process.exit(0)
  },
  $MOD_WATCH: () => {
    Project.Current.sourceModifier.initAndWatch();
    // process.exit(0)
  }

}
//#endregion