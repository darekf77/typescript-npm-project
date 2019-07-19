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
import { BuildDir } from '../../models';

export class StaticBuild extends FeatureForProject {

  static alerdyRegenerated = [];
  regenerate() {
    // console.log(StaticBuild.alerdyRegenerated)
    if (StaticBuild.alerdyRegenerated.includes(this.project.location)) {
      log(`Already regenrated workspace ${this.project.genericName}`)
      return;
    } else {
      // console.log(`NOT YET GENERATED ${this.project.genericName}`)
    }
    if (this.project.isWorkspaceChildProject) {
      if (!this.project.parent.distribution) {
        this.project.parent.staticBuild.regenerate();
        return;
      }
    }
    regenerateDistribution(this.project);
    if (this.project.isWorkspace) {
      this.project.children.forEach(c => regenerateDistribution(c));
    }
  }

}

function regenerateDistribution(project: Project): void {

  info(`Actual Regenerating project: ${project.genericName}`);
  StaticBuild.alerdyRegenerated.push(project.location)
  const outDir: BuildDir = 'dist';

  const genLocation = project.isWorkspace ?
    path.join(project.location, outDir, project.name) :
    path.join(project.parent.location, outDir, project.parent.name, project.name);

  if (project.isWorkspace && project.isSite) {
    const genLocationBaseline = path.join(project.location, outDir, project.baseline.name);
    project.baseline.copyManager.generateSourceCopyIn(genLocationBaseline, { override: false });
    const binInBasleine = path.join(genLocationBaseline, config.folder.node_modules, config.folder._bin);
    fse.mkdirpSync(binInBasleine)
  }

  if (project.isWorkspace) {
    if (project.distribution) {
      project.copyManager.genWorkspaceEnvFiles(project.distribution);
    } else {
      project.copyManager.generateSourceCopyIn(genLocation, { override: true });
    }
  } else if (project.isWorkspaceChildProject) {
    project.copyManager.generateSourceCopyIn(genLocation, { override: true });
  }

}

 //#endregion
