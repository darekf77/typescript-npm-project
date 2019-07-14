//#region @backend
import * as path from 'path';
import * as sleep from 'sleep';
import * as glob from 'glob';
import * as fse from 'fs-extra';
import { Project, FeatureForProject } from '../abstract';
import * as rimraf from 'rimraf';
import { BuildOptions } from './build-options';
import { info, log, tryCopyFrom } from '../../helpers';
import chalk from 'chalk';
import config from '../../config';

export class StaticBuild extends FeatureForProject {

  private async  regenerateProject(project: Project, buildOptions: BuildOptions, args: string) {
    log(`Regenerating project: ${project.genericName}`);

    info(`Actual Regenerating project: ${project.genericName}`);
    const { outDir } = buildOptions;

    let genLocation = project.isWorkspace ?
      path.join(project.location, outDir, project.name) :
      path.join(project.parent.location, outDir, project.parent.name, project.name);

    if (project.isWorkspace && project.isSite) {
      const genLocationBaseline = path.join(project.location, outDir, project.baseline.name);
      project.baseline.copyManager.generateSourceCopyIn(genLocationBaseline, { override: false });
      const binInBasleine = path.join(genLocationBaseline, config.folder.node_modules, config.folder._bin);
      fse.mkdirpSync(binInBasleine)
    }

    let genProject = Project.From(genLocation);


    if (project.isWorkspace) {
      if (genProject) {
        project.copyManager.genWorkspaceEnvFiles(genProject)
      } else {
        project.copyManager.generateSourceCopyIn(genLocation, { override: true });
      }
    } else if (project.isWorkspaceChildProject) {
      project.copyManager.generateSourceCopyIn(genLocation, { override: true });
    }

    genProject = Project.From(genLocation);

    if (project.isWorkspace) {
      for (let index = 0; index < project.children.length; index++) {
        const c = project.children[index];
        await this.regenerateProject(c, buildOptions, args)
      }
    }

    return genProject;
  }

}

 //#endregion
