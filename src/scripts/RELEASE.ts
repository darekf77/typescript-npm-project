
import { Project, BaseProjectLib } from "../project";

export default {
  $RELEASE: async (args) => {
    console.log('async release args', args)
    process.exit(0);
    Project.Current.checkIfReadyForNpm();
    await (Project.Current as BaseProjectLib).release()

    process.exit(0)
  },
  $RELEASE_PROD: async () => {
    Project.Current.checkIfReadyForNpm();
    await (Project.Current as BaseProjectLib).release({ prod: true })

    process.exit(0)
  },
  COPY_RESOURCES: () => {
    Project.Current.checkIfReadyForNpm();
    (Project.Current as BaseProjectLib).bundleResources()

    process.exit(0)
  }
}
