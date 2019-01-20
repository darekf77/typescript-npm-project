//#region @backend
import { Project } from '../project';

function $CONFIGS() {
  console.log(Project.Current.env.configsFromJs.map(c => c.domain))
  process.exit(0)
}

export default {
  $CONFIGS
}
//#endregion
