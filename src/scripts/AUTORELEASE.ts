import { AutoActions } from './AUTOBUILD';
import { Project } from '../project';


function autorelease(project: Project) {
  const autorelease = new AutoActions(project);
  autorelease.release()
}

export default {
  $autorelease: (args) => {
    autorelease(Project.Current)
  }
}
