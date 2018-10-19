import * as path from 'path';
import { Project, ProjectFrom } from '../project';


export namespace CloudHelpers {

  export function cloudProject() {
    return ProjectFrom(path.join(Project.Tnp.location, 'projects/site'));
  }

  export function cloudBuild() {
    cloudProject().run(`tnp build`, { biggerBuffer: true }).sync();
  }

  export function reinit() {
    cloudProject().run(`tnp clear`).sync();
    cloudProject().run(`tnp init --env=online`).sync();
  }

  export function cloudBuildNoOutput() {
    cloudProject().run(`nohup tnp build`, { biggerBuffer: true }).sync();
  }

  export function cloudStartNoOutput() {
    cloudProject().run(`nohup tnp start &`).sync();
  }



}
