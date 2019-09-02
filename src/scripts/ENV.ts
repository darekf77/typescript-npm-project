//#region @backend
import { Project } from '../project';
import { config } from '../config';
import { Helpers } from '../helpers';

function $CONFIGS() {
  Helpers.log(Project.Current.env.configsFromJs.map(c => c.domain).join('\n'));
  process.exit(0)
}

function CHECK_ENV() {
  Helpers.checkEnvironment(config.required);
}

export default {
  $CONFIGS,
  CHECK_ENV,
  ENV_CHECK() {
    CHECK_ENV()
  }
}
//#endregion
