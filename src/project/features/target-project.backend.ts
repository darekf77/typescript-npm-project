import { _ } from 'tnp-core';
import { glob } from 'tnp-core';
import { path } from 'tnp-core'
import { fse } from 'tnp-core'
import chalk from 'chalk';
import { Models } from 'tnp-models';
import { config } from 'tnp-config';
import { FeatureForProject } from '../abstract/feature-for-project';
import { Helpers, Project } from 'tnp-helpers';
// import type { Project } from '../abstract/project/project';

const DEFAULT_PATH_GENERATED = 'tmp-target-projects/generated';
const DEFAULT_PATH_ORIGINS = 'tmp-target-projects/origins';

export class TargetProject extends FeatureForProject {
  //#region @backend

  public get exists() {
    return this.all.length > 0;
  }

  private get all() {
    return this.project.packageJson.targetProjects.map(p => {
      if (!_.isString(p.path)) {
        p.path = path.join(this.project.location, DEFAULT_PATH_GENERATED, this.project.name);
      }
      if (!path.isAbsolute(p.path)) {
        p.path = path.resolve(path.join(this.project.location, p.path));
      }
      return p;
    })
  }

  async update() {
    console.log('update target project', this.all)
    this.all.forEach(a => generate(this.project, a));
  }

  //#endregion
}


async function generate(project: Project, t: Models.npm.TargetProject) {
  if (!Helpers.exists(path.dirname(t.path))) {
    Helpers.mkdirp(path.dirname(t.path));
  }
  const originDefaultPath = path.join(project.location, DEFAULT_PATH_ORIGINS, _.kebabCase(t.origin));
  if (!Helpers.exists(path.dirname(originDefaultPath))) {
    Helpers.mkdirp(path.dirname(originDefaultPath));
  }
  if (!Helpers.exists(originDefaultPath)) {
    Helpers.git.clone({
      cwd: path.dirname(originDefaultPath),
      url: t.origin,
      destinationFolderName: _.kebabCase(t.origin)
    });
  }

  await Helpers.git.pullCurrentBranch(originDefaultPath);

  if (!Helpers.exists(t.path)) {
    Helpers.copy(originDefaultPath, t.path);
  }
  try {
    Helpers.run(`git checkout ${t.branch} && git pull origin ${t.branch}`, { cwd: t.path }).sync();
  } catch (e) {
    Helpers.error(`[target-project] Not able create target project `
      + `${chalk.bold(project.name)} from origin ${t.origin}...`);
  }

  [
    ...(_.isArray(t.links) ? t.links : []),
    config.folder.components,
    config.folder.src,
    ...project.resources,
    config.file.index_js,
    config.file.index_js_map,
    config.file.index_d_ts,
    config.folder.bin,
  ].forEach(l => {
    const source = path.join(project.location, l);
    const dest = path.join(t.path, l);
    if (Helpers.exists(source)) {
      if (Helpers.isFolder(source)) {
        Helpers.copy(source, dest);
      } else {
        Helpers.copyFile(source, dest);
      }
    }
  });

  [
    config.folder.node_modules,
  ].forEach(l => {
    const source = path.join(project.location, l);
    const dest = path.join(t.path, l);
    Helpers.removeIfExists(dest);
    Helpers.createSymLink(source, dest,
      { continueWhenExistedFolderDoesntExists: true });
  });

  Helpers.run(`code ${t.path}`).sync();

}
