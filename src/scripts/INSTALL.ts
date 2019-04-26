//#region @backend
import { Project } from '../project';

export function INSTALL(args, exit = true) {
  Project.Current.npmPackages.fromArgs(args);
  if (exit) {
    process.exit(0);
  }
}

export default {
  INSTALL,
  $I: (args) => {
    INSTALL(args);
    process.exit(0);
  }
}
//#endregion
