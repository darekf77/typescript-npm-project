//#region @backend
import { Project } from '../project';

export async function INSTALL(args, exit = true) {
  await Project.Current.npmPackages.fromArgs(args);
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
