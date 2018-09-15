//#region @backend
import { AutoActions } from './AUTOBUILD';
import { Project } from '../project';


function autorelease(project: Project) {
  const autorelease = new AutoActions(project);
  autorelease.release()
  process.exit(0)
}

export default {
  $autorelease: (args) => {
    autorelease(Project.Current)
  }
}

//#endregion
