import { config } from 'tnp-config';
import { Helpers } from 'tnp-helpers';
import { Project } from '../../project';


async function $UPATE_CLOUD() {

}

async function $DETECT_GLOBAL_LIBS() {
  (Project.Current as Project).workerApps.detectGlobal();
  process.exit(0)
}

export default {
  $UPATE_CLOUD: Helpers.CLIWRAP($UPATE_CLOUD, '$UPATE_CLOUD'),
  $DETECT_GLOBAL_LIBS: Helpers.CLIWRAP($DETECT_GLOBAL_LIBS, '$DETECT_GLOBAL_LIBS'),

}
