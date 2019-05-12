//#region @backend
import * as path from 'path';
import * as sleep from 'sleep';
import { Project, FeatureForProject } from '../abstract';
import * as rimraf from 'rimraf';
import { BuildOptions } from './build-options';
import { info, log } from '../../helpers';
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
      project.baseline.copyManager.generateSourceCopyIn(genLocationBaseline, { override: true });
    }

    let genProject = Project.From(genLocation);
    if(genProject && genProject.isWorkspaceChildProject) {
      genProject.reset()
    }

    if (project.isWorkspace) {
      if (!genProject) {
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

  async resolveProjectIfGenerated(buildOptions: BuildOptions, args: string): Promise<Project> {
    const project = this.project;
    const { watch } = buildOptions;

    if (!watch && !project.isGenerated && !project.isStandaloneProject) {

      // run('clear').sync()
      // console.log('REGENERATING PROJECT!')
      // sleep.sleep(3);

      let genProject: Project;
      genProject = await this.regenerateProject(project, buildOptions, args);
      await genProject.filesStructure.reset({ recrusive: true })

      let { env } = require('minimist')(!args ? [] : args.split(' '));
      if (env) {
        info(`ENVIRONMENT: ${chalk.bold(env)}`)
      } else {
        args += `${args} --env=static`
        info(`ENVIRONMENT (auto-assigned): "${chalk.bold('static')}"`)
      }

      await genProject.filesStructure.init(args)

      return genProject;
    }
    return project;
  }

}

 //#endregion
