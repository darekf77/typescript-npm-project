//#region @backend
import * as path from 'path';
import * as sleep from 'sleep';
import * as glob from 'glob';
import * as fse from 'fs-extra';
import { Project, FeatureForProject } from '../abstract';
import * as rimraf from 'rimraf';
import { BuildOptions } from './build-options';
import { info, log, tryCopyFrom, error } from '../../helpers';
import chalk from 'chalk';
import config from '../../config';
import { BuildDir } from '../../models';

export class StaticBuild extends FeatureForProject {

  static alerdyRegenerated = [];
  async regenerate(regenerateWorkspaceChildren = true) {
    // console.log(StaticBuild.alerdyRegenerated)
    if (StaticBuild.alerdyRegenerated.includes(this.project.location)) {
      log(`Already regenrated workspace ${this.project.genericName}`)
      return;
    } else {
      // console.log(`NOT YET GENERATED ${this.project.genericName}`)
    }
    if (this.project.isWorkspaceChildProject) {
      if (!this.project.parent.distribution) {
        await this.project.parent.staticBuild.regenerate();
        return;
      }
      await this.project.parent.staticBuild.regenerate(false);
    }
    await regenerateDistribution(this.project);
    if (this.project.isWorkspace && regenerateWorkspaceChildren) {
      for (let index = 0; index < this.project.children.length; index++) {
        const c = this.project.children[index];
        await regenerateDistribution(c)
      }
    }
  }

}

async function regenerateDistribution(project: Project) {

  info(`Actual Regenerating project: ${project.genericName}`);
  StaticBuild.alerdyRegenerated.push(project.location)
  const outDir: BuildDir = 'dist';

  const genLocation = project.isWorkspace ?
    path.join(project.location, outDir, project.name) :
    path.join(project.parent.location, outDir, project.parent.name, project.name);

  if (project.isWorkspace && project.isSite) {
    const genLocationBaseline = path.join(project.location, outDir, project.baseline.name);
    project.baseline.copyManager.generateSourceCopyIn(genLocationBaseline);
    for (let index = 0; index < project.baseline.children.length; index++) {
      const baselineChild = project.baseline.children[index];
      baselineChild.copyManager.generateSourceCopyIn(path.join(genLocationBaseline, baselineChild.name));
    }
    const generatedBaseline = Project.From(genLocationBaseline);
    const nodeModuleBinInRealBaseline = path.join(project.baseline.location, config.folder.node_modules, config.folder._bin);
    if (!fse.existsSync(nodeModuleBinInRealBaseline)) {
      fse.mkdirpSync(nodeModuleBinInRealBaseline);
    }
    const tmpEnvironment = path.join(project.baseline.location, config.file.tnpEnvironment_json);
    if (!fse.existsSync(tmpEnvironment)) {
      await project.baseline.filesStructure.init(``);
    }
    project.baseline.copyManager.genWorkspaceEnvFilesInside(generatedBaseline);
    const binInBasleine = path.join(genLocationBaseline, config.folder.node_modules, config.folder._bin);
    fse.mkdirpSync(binInBasleine);
  }

  if (project.isWorkspace) {
    if (project.distribution) {
      project.copyManager.genWorkspaceEnvFilesInside(project.distribution);
    } else {
      project.copyManager.generateSourceCopyIn(genLocation);
    }
  } else if (project.isWorkspaceChildProject) {
    project.copyManager.generateSourceCopyIn(genLocation, { override: false });
  }

}

 //#endregion
