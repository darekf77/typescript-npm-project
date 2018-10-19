//#region @backend
import * as path from 'path';

import { ProjectFrom, Project } from '../project';



export function $CLOUD_INSTALL(args) {

  let cloudProject = ProjectFrom(path.join(Project.Tnp.location, 'projects/site'));
  cloudProject.run(`tnp clear`).sync();
  cloudProject.run(`tnp init --env=online`).sync();
  cloudProject.run(`tnp build`).sync();
  cloudProject.run(`nohup tnp start &`).sync();
}
//#endregion
