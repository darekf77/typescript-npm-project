//#region @backend
import * as path from 'path';

import { ProjectFrom, Project } from '../project';
import { CloudHelpers } from './CLOUD-helpers';



export function $CLOUD_INSTALL(args) {

  CloudHelpers.reinit()
  CloudHelpers.cloudBuild()
  CloudHelpers.cloudStartNoOutput()
  process.exit(0)
}
//#endregion
