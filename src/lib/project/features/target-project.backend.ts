import { _ } from 'tnp-core/src';
import { glob } from 'tnp-core/src';
import { path } from 'tnp-core/src';
import { fse } from 'tnp-core/src';
import chalk from 'chalk';
import { config } from 'tnp-config/src';
import { BaseFeatureForProject } from 'tnp-helpers/src';
import { Helpers } from 'tnp-helpers/src';
import { Project } from '../abstract/project';
import { Models } from '../../models';

export class TargetProject extends BaseFeatureForProject<Project> {
  //#region @backend

  public get exists() {
    return this.all.length > 0;
  }

  private get all() {
    return _.cloneDeep(this.project.__packageJson.targetProjects).map(
      (p: any) => {
        const res = p as Models.TargetProject;
        res.path = path.join(
          this.project.location,
          config.folder.targetProjects.DEFAULT_PATH_GENERATED,
          _.kebabCase(res.origin),
          _.kebabCase(res.branch),
        );
        // if (!_.isString(p.path)) {
        //   p.path = path.join(this.project.location, DEFAULT_PATH_GENERATED, this.project.name);
        // }
        // if (!path.isAbsolute(p.path)) {
        //   p.path = path.resolve(path.join(this.project.location, p.path));
        // }
        return res;
      },
    );
  }

  async update() {
    for (let index = 0; index < this.all.length; index++) {
      const a = this.all[index];
      await generate(this.project, a);
    }
  }

  //#endregion
}

async function generate(project: Project, t: Models.TargetProject) {
  project.__packageJson.showDeps('taget project generation');
  if (!Helpers.exists(path.dirname(t.path))) {
    Helpers.mkdirp(path.dirname(t.path));
  }
  const originDefaultPath = path.join(
    project.location,
    config.folder.targetProjects.DEFAULT_PATH_ORIGINS,
    _.kebabCase(t.origin),
  );

  if (!Helpers.exists(path.dirname(originDefaultPath))) {
    Helpers.mkdirp(path.dirname(originDefaultPath));
  }
  if (!Helpers.exists(originDefaultPath)) {
    await Helpers.git.clone({
      cwd: path.dirname(originDefaultPath),
      url: t.origin,
      destinationFolderName: _.kebabCase(t.origin),
    });
  }
  Helpers.log('PULLLING BRANCH');
  await Helpers.git.pullCurrentBranch(originDefaultPath);

  if (Helpers.exists(t.path)) {
    Helpers.removeFolderIfExists(t.path);
  }
  Helpers.copy(originDefaultPath, t.path);
  let switched = true;
  try {
    Helpers.run(`git checkout ${t.branch}`, { cwd: t.path }).sync();
    await Helpers.git.pullCurrentBranch(t.path);
  } catch (e) {
    switched = false;
  }
  if (!switched) {
    try {
      Helpers.run(`git checkout -b ${t.branch}`, { cwd: t.path }).sync();
      await Helpers.git.pullCurrentBranch(t.path);
    } catch (error) {
      Helpers.error(
        `[target-project] Not able create target project (git checkout -b failed)` +
          `${chalk.bold(project.name)} from origin ${t.origin}...`,
      );
    }
  }

  Helpers.log('UPDATING');

  [
    ...(_.isArray(t.links) ? t.links : []),
    config.folder.components,
    config.folder.src,
    config.file.package_json,
    ...project.__resources,
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
            config.folder.out,
          ],
        });
      } else {
        Helpers.copyFile(source, dest);
      }
    }
  });
  Helpers.info('COPY DONE');
  [config.folder.node_modules].forEach(l => {
    const source = path.join(project.location, l);
    const dest = path.join(t.path, l);
    Helpers.removeIfExists(dest);
    Helpers.createSymLink(source, dest, {
      continueWhenExistedFolderDoesntExists: true,
    });
  });

  _.values(config.frameworkNames).forEach(f => {
    Helpers.setValueToJSON(
      path.join(t.path, config.file.package_json),
      `${f}.targetProjects`,
      void 0,
    );
  });
  [config.file.yarn_lock, config.file.firedev_jsonc].forEach(dumbFiles => {
    Helpers.removeFileIfExists(path.join(t.path, dumbFiles));
  });
  Helpers.run(`code ${t.path}`).sync();
  Helpers.info('DONE');
}
