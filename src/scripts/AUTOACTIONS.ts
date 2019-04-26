import * as path from 'path';
import * as _ from 'lodash';

import { Project } from "../project";
import { error, info } from '../helpers';
import { config as globalConfig } from '../config';

export interface ProjectForAutoBuild {
  cwd: string,
  command: string;
  commandWatch: string;
  args?: string[];
}

export interface ProjectForAutoRelease {
  cwd: string,
  command: string;
  args?: string[];
}

export interface AutoActionsUser {
  builds?: ProjectForAutoBuild[];
  autoreleases?: ProjectForAutoRelease[];
}

export class AutoActions {

  readonly config: AutoActionsUser;

  constructor(private project: Project) {

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

export async function autobuild(project: Project, watch = false, exit = true) {

  const ab = new AutoActions(project);
  await ab.build(watch)
  if (exit) {
    process.exit(0)
  }
}

function autorelease(project: Project) {
  const ar = new AutoActions(project);
  ar.release()
  process.exit(0)
}

export default {
  $AUTOBUILD: async (args: string) => {
    await autobuild(Project.Current, !!args.split(' ').find(a => a == 'watch'))
  },
  $AUTOBUILD_WATCH: async () => {
    await autobuild(Project.Current, true)
  },
  $AUTOBUILDWATCH: async () => {
    // console.log('AUTOBUILD!')
    await autobuild(Project.Current, true)
  },
  $autorelease: () => {
    autorelease(Project.Current)
  }

};
//#endregion
