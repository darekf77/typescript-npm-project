
//#region @backend
import { Project } from "../project";
import { Models } from '../models';

export default {
  $RELEASE: async (args) => {
    const argsObj: Models.dev.ReleaseOptions = require('minimist')(args.split(' '));
    argsObj.args = args;
    Project.Current.checkIfReadyForNpm();
    await Project.Current.release(argsObj)

    process.exit(0)
  },
  $RELEASE_PROD: async (args) => {
    const argsObj: Models.dev.ReleaseOptions = require('minimist')(args.split(' '));
    argsObj.prod = true;
    argsObj.args = args;
    Project.Current.checkIfReadyForNpm();
    await Project.Current.release(argsObj)

    process.exit(0)
  },

}
//#endregion
