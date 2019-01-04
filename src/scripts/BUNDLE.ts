//#region @backend
import { Project } from '../project';



export default {
  $isbundlemode(args) {
    console.log('IS BUNDLE MODE? ', Project.Current.isBundleMode)
    process.exit(0)
  }
}
//#endregion
