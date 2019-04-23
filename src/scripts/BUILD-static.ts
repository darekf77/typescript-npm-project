//#region @backend
import * as path from 'path';
import * as sleep from 'sleep';
import { ProjectFrom, Project } from '../project';
import { initFromArgs } from './INIT';
import * as rimraf from 'rimraf';
import { BuildOptions } from '../project/features/build-options';




async function regenerateProject(project: Project, buildOptions: BuildOptions, args: string) {
  const { outDir } = buildOptions;

  const genLocation = project.isWorkspace ?
    path.join(project.location, outDir, project.name) :
    path.join(project.parent.location, outDir, project.parent.name, project.name);

  if (project.isWorkspace && project.isSite) {
    const genLocationBaseline = path.join(project.location, outDir, project.baseline.name);
    project.baseline.copytToManager.generateSourceCopyIn(genLocationBaseline);
  }

  let genProject = ProjectFrom(genLocation);
  if (project.isWorkspace) {
    if (!genProject) {
      project.copytToManager.generateSourceCopyIn(genLocation);
    }
  } else if (project.isWorkspaceChildProject) {
    rimraf.sync(genLocation);
    project.copytToManager.generateSourceCopyIn(genLocation);
  }

  genProject = ProjectFrom(genLocation);
  // genProject.clear()

  await initFromArgs(args).project(genProject);


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
