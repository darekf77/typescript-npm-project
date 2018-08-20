
import { Project, BaseProjectLib } from "../project";
import { ReleaseOptions } from '../models';

export default {
  $RELEASE: async (args) => {
    const argsObj: ReleaseOptions = require('minimist')(args.split(' '));
    Project.Current.checkIfReadyForNpm();
    await (Project.Current as BaseProjectLib).release(argsObj)

    process.exit(0)
  },
  $RELEASE_PROD: async (args) => {
    const argsObj: ReleaseOptions = require('minimist')(args.split(' '));
    argsObj.prod = true;
    Project.Current.checkIfReadyForNpm();
    await (Project.Current as BaseProjectLib).release(argsObj)

    process.exit(0)
  },
  COPY_RESOURCES: () => {
    Project.Current.checkIfReadyForNpm();
    (Project.Current as BaseProjectLib).bundleResources()

    process.exit(0)
  }
}
