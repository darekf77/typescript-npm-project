import { config } from 'tnp-config/src';
import { Helpers } from 'tnp-helpers/src';
import { Project } from '../../project';


async function $UPATE_CLOUD() {

}

async function $DETECT_GLOBAL_LIBS() {
  const proj = (Project.Current as Project);
  const libs = proj.workerApps.detectGlobal;
  Helpers.info(`
OUTPUT:
  ${libs.join('\n')}

  ` )
  process.exit(0)
}

export default {
  $UPATE_CLOUD: Helpers.CLIWRAP($UPATE_CLOUD, '$UPATE_CLOUD'),
  $DETECT_GLOBAL_LIBS: Helpers.CLIWRAP($DETECT_GLOBAL_LIBS, '$DETECT_GLOBAL_LIBS'),

}
