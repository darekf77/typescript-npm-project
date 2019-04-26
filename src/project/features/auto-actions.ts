//#region @backend
import * as path from 'path';
import chalk from 'chalk';
import * as _ from 'lodash';

import { FeatureForProject, Project } from '../abstract';
import { AutoActionsUser, ProjectForAutoRelease, ProjectForAutoBuild } from '../../models';
import { config as globalConfig } from '../../config';
import { info, error } from '../../helpers';

export class AutoActions extends FeatureForProject {

  readonly config: AutoActionsUser;

  constructor(public project: Project) {
    super(project);

    const autobuildjsonfilePath = path.join(Project.Tnp.location, globalConfig.file.autob_actions_js);
    this.config = require(`${autobuildjsonfilePath}`);
  }


  release() {

    const autoreleases: ProjectForAutoRelease[] = this.config.autoreleases;
    if (!_.isArray(autoreleases)) {
      error(`No autoreleases in autobuild.json.`)
    }
    const release = autoreleases.find(b => {
      return path.resolve(b.cwd) === path.resolve(this.project.location)
    });
    if (!release) {
      error(`No autoreleases for current project.`)
    }
    // console.log('release', release)

    const command = `${release.command} ${(_.isArray(release.args) ? release.args
      .filter(a => !a.trim().startsWith('#'))
      .join(' ') : '')}`

    // console.log(`"${command}"`)

    this.project.run(command).sync()

    info(`Done`);
  }

  private getBuild() {


    const build: ProjectForAutoBuild = this.config.builds
      .find(b => {
        const p = Project.From(b.cwd);

        if (!p) {
          console.log(`Project in "${b.cwd}" is "${p && p.name}"`)
          error(`Please fix your autobuild.js`);
        }
        return path.resolve(p.location) === path.resolve(this.project.location)
      });

    // console.log('build', build)
    return build;
  }

  async build(watch = false) {
    const build = this.getBuild();
    // console.log('build',build)
    if (!build) {
      error(`Not build for current project "${this.project.name}"   `)
    } else {
      if (!this.project.isTnp) {
        await this.project.git.updateOrigin(true);
      }
      this.project.run(`${watch ? build.commandWatch : build.command} ${(_.isArray(build.args) ? build.args
        .filter(a => !a.trim().startsWith('#'))
        .join(' ') : '')}`).sync()
    }
  }

}
