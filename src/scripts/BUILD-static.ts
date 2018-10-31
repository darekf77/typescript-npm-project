//#region @backend
import * as path from 'path';
import * as sleep from 'sleep';
import { BuildOptions } from '../models';
import { ProjectFrom, Project } from '../project';
import { init } from './INIT';
import { clearConsole, run } from '../process';




async function regenerateProject(project: Project, buildOptions: BuildOptions, args: string) {
  const { outDir } = buildOptions;

  const genLocation = project.isWorkspace ?
    path.join(project.location, outDir, project.name) :
    path.join(project.parent.location, outDir, project.parent.name, project.name);

  let genProject = ProjectFrom(genLocation);
  if (!genProject) {
    project.copytToManager.generateCopyIn(genLocation);
  }
  genProject = ProjectFrom(genLocation);
  await init(args).project(genProject);
  return genProject;
}

export async function resolveProjectIfGenerated(project: Project, buildOptions: BuildOptions, args: string): Promise<Project> {
  const { watch } = buildOptions;

  if (!watch && !project.isGenerated && !project.isStandaloneProject) {

    // run('clear').sync()
    // console.log('REGENERATING PROJECT!')
    // sleep.sleep(3);

    let genProject: Project;

    if (project.isWorkspaceChildProject) {
      await regenerateProject(project.parent, buildOptions, args);
      genProject = await regenerateProject(project, buildOptions, args);
    } else if (project.isWorkspace) {
      genProject = await regenerateProject(project, buildOptions, args);
    }
    return genProject;
  }
  return project;
}
//#endregion
