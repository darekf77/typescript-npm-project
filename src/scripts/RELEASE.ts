
//#region @backend
import { Project, LibProject } from "../project";
import { ReleaseOptions } from '../models';

export default {
  $RELEASE: async (args) => {
    const argsObj: ReleaseOptions = require('minimist')(args.split(' '));
    Project.Current.checkIfReadyForNpm();
    await (Project.Current as LibProject).release(argsObj)

    process.exit(0)
  },
  $RELEASE_PROD: async (args) => {
    const argsObj: ReleaseOptions = require('minimist')(args.split(' '));
    argsObj.prod = true;
    Project.Current.checkIfReadyForNpm();
    await (Project.Current as LibProject).release(argsObj)

    process.exit(0)
  },

}
//#endregion
