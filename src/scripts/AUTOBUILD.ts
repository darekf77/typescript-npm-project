//#region @backend
import * as fse from "fs-extra";
import * as path from 'path';
import * as os from 'os';
import * as _ from 'lodash';

import { Project, ProjectFrom } from "../project";
import { error, info } from '../messages';
import { clearConsole } from '../process';
import { walkObject } from '../helpers';
import chalk from 'chalk';
import * as JSON5 from 'json5';
import { config as globalConfig } from '../config';

// function popertyKey(key: string) {

//   return
// }

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
    // console.log(this.config)
    process.exit(0)
    this.trimConfigPropsValues();
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

  private trimConfigPropsValues() { // TODO make this works, lodash path with dot
    // // walkObject(this.config, lodashPath => {
    // //   const p = _.get(this.config, lodashPath);
    // //   if (_.isString(p)) {
    // //     console.log(`${lodashPath} v: "${chalk.bold(p)}"`)
    // //     _.set(this.config, lodashPath, p.trim())
    // //   }
    // })
  }

  private getBuild() {


    const build: ProjectForAutoBuild = this.config.builds
      .find(b => {
        const p = ProjectFrom(b.cwd);

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
    if (!build) {
      error(`Not build for current project "${this.project.name}"   `)
    } else {
      clearConsole();
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

  const autobuild = new AutoActions(project);
  await autobuild.build(watch)
  if (exit) {
    process.exit(0)
  }
}



export default {
  $AUTOBUILD: async (args: string) => {
    await autobuild(Project.Current, !!args.split(' ').find(a => a == 'watch'))
  },
  $AUTOBUILD_WATCH: async () => {
    await autobuild(Project.Current, true)
  },
  $AUTOBUILDWATCH: async () => {
    await autobuild(Project.Current, true)
  }

}
//#endregion
