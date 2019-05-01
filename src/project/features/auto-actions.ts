//#region @backend
import * as path from 'path';
import chalk from 'chalk';
import * as _ from 'lodash';

import { FeatureForProject, Project } from '../abstract';
import { AutoActionsUser, ProjectForAutoRelease, ProjectForAutoBuild } from '../../models';
import { config } from '../../config';
import { info, error } from '../../helpers';

export class AutoActions extends FeatureForProject {

  configuration: AutoActionsUser;

  constructor(public project: Project) {
    super(project);


  }

  private init() {
    const autobuildjsonfilePath = path.join(config.pathes.tnp_folder_location, config.file.autob_actions_js);
    this.configuration = require(`${autobuildjsonfilePath}`);
  }


  release() {
    this.init()
    const autoreleases: ProjectForAutoRelease[] = this.configuration.autoreleases;
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


    const build: ProjectForAutoBuild = this.configuration.builds
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
    this.init()
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

//#endregion
