import { _ } from 'tnp-core';
import { glob } from 'tnp-core';
import { path } from 'tnp-core'
import { fse } from 'tnp-core'
import chalk from 'chalk';
import { Models } from 'tnp-models';
import { config } from 'tnp-config';
import { FeatureForProject } from '../abstract/feature-for-project';
import { Helpers } from 'tnp-helpers';
import { Project } from '../abstract/project/project';


export class TargetProject extends FeatureForProject {
  //#region @backend

  public get exists() {
    return this.all.length > 0;
  }

  private get all() {
    return _.cloneDeep(this.project.packageJson.targetProjects).map((p: any) => {
      const res = p as Models.npm.TargetProject;
      res.path = path.join(
        this.project.location,
        config.folder.targetProjects.DEFAULT_PATH_GENERATED,
        _.kebabCase(res.origin),
        _.kebabCase(res.branch)
      );
      // if (!_.isString(p.path)) {
      //   p.path = path.join(this.project.location, DEFAULT_PATH_GENERATED, this.project.name);
      // }
      // if (!path.isAbsolute(p.path)) {
      //   p.path = path.resolve(path.join(this.project.location, p.path));
      // }
      return res;
    })
  }

  async update() {
    console.log('update target project', this.all)
    this.all.forEach(a => generate(this.project, a));
  }

  //#endregion
}


async function generate(project: Project, t: Models.npm.TargetProject) {
  project.packageJson.showDeps('taget project generation');
  if (!Helpers.exists(path.dirname(t.path))) {
    Helpers.mkdirp(path.dirname(t.path));
  }
  const originDefaultPath = path.join(
    project.location,
    config.folder.targetProjects.DEFAULT_PATH_ORIGINS,
    _.kebabCase(t.origin)
  );

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

  // Helpers.git.pullCurrentBranch(originDefaultPath);

  if (Helpers.exists(t.path)) {
    Helpers.removeFolderIfExists(t.path);
  }
  Helpers.copy(originDefaultPath, t.path);
  try {
    Helpers.run(`git checkout ${t.branch}`, { cwd: t.path }).sync();
    // Helpers.git.pullCurrentBranch( t.path);
  } catch (e) {
    try {
      Helpers.run(`git checkout -b ${t.branch}`, { cwd: t.path }).sync();
      // Helpers.git.pullCurrentBranch( t.path);
    } catch (error) {
      Helpers.error(`[target-project] Not able create target project (git checkout -b failed)`
        + `${chalk.bold(project.name)} from origin ${t.origin}...`);
    }
  }

  [
    ...(_.isArray(t.links) ? t.links : []),
    config.folder.components,
    config.folder.src,
    config.file.package_json,
    ...project.resources,
    config.file.index_js,
    config.file.index_js_map,
    config.file.index_d_ts,
    config.folder.bin,
  ].forEach(l => {
    const source = path.join(project.location, l);
    const dest = path.join(t.path, l);
    // Helpers.info(`
    // copy;
    // source: ${source}
    // dest: ${dest}
    // `)
    if (Helpers.exists(source)) {
      if (Helpers.isFolder(source)) {
        Helpers.copy(source, dest, {
          asSeparatedFiles: true,
          asSeparatedFilesAllowNotCopied: true,
          omitFolders: [
            config.folder.node_modules,
            config.folder.dist,
            config.folder.bundle,
            config.folder.out,
          ],
        });
      } else {
        Helpers.copyFile(source, dest);
      }
    }
  });
  Helpers.info('COPY DONE');
  [
    config.folder.node_modules,
  ].forEach(l => {
    const source = path.join(project.location, l);
    const dest = path.join(t.path, l);
    Helpers.removeIfExists(dest);
    Helpers.createSymLink(source, dest,
      { continueWhenExistedFolderDoesntExists: true });
  });

  _.values(config.frameworkNames).forEach(f => {
    Helpers.setValueToJSON(path.join(t.path, config.file.package_json), `${f}.targetProjects`, void 0);
  });
  [
    config.file.yarn_lock,
    config.file.package_json5
  ].forEach(dumbFiles => {
    Helpers.removeFileIfExists(path.join(t.path, dumbFiles));
  });
  Helpers.run(`code ${t.path}`).sync();
  Helpers.info("DONE")

}
