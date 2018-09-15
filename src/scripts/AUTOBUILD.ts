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

export interface AutoActionsConfigComputer {
  [userName: string]: AutoActionsUser;
}

export interface JSONAutoActionsConfig {
  [computerNames: string]: AutoActionsConfigComputer | string;
}

export class AutoActions {


  readonly config: JSONAutoActionsConfig;



  constructor(private project: Project) {

    const autobuildjsonfilePath = path.join(Project.Tnp.location, 'autobuild.json');
    this.config = fse.readJsonSync(autobuildjsonfilePath, {
      encoding: 'utf8'
    });
    this.validateConfig()
    this.trimConfigPropsValues();
  }

  private validateConfig() {
    let hostname = this.hostname;
    const username = os.userInfo().username.toLowerCase();
    if (!this.config) {
      error('Bad autobuild.json config!')
    }
    if (!this.config[hostname]) {
      error(`Hostname: "${hostname}" not found in autobuild.json config!`)
    }
    if (!this.config[hostname][username]) {
      error(`Username: "${username}" not found in autobuild.json config!`)
    }
  }

  get hostname() {
    let hostname = os.hostname();
    let orgHostname = hostname;
    if (_.isString(this.config[hostname])) {
      hostname = this.config[hostname] as string;
      if (!this.config[hostname]) {
        error(`Bad hostname alisas: "${orgHostname}":"${hostname}": `)
      }
    }
    return hostname;
  }

  release() {
    console.log('config', this.config)
    const hostname = this.hostname;
    const username = os.userInfo().username.toLowerCase();
    console.log('hostname', hostname)
    console.log('username', username)
    const autoreleases: ProjectForAutoRelease[] = this.config[hostname][username].autoreleases;
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
    // console.log('config', this.config)
    const hostname = this.hostname;
    const username = os.userInfo().username.toLowerCase();



    const build: ProjectForAutoBuild = this.config[hostname][username].builds
      .find(b => {
        const p = ProjectFrom(b.cwd);

        if (!p) {
          console.log('hostname', hostname)
          console.log('username', username)
          console.log(`Project in "${b.cwd}" is "${p && p.name}"`)
          error(`Please fix your autobuild.json`);
        }
        return path.resolve(p.location) === path.resolve(this.project.location)
      });

    // console.log('build', build)
    return build;
  }

  build(watch = false) {
    const build = this.getBuild();
    if (!build) {
      error(`Not build for current project "${this.project.name}"   `)
    } else {
      clearConsole();
      if (!this.project.isTnp) {
        this.project.git.updateOrigin();
      }
      this.project.run(`${watch ? build.commandWatch : build.command} ${(_.isArray(build.args) ? build.args
        .filter(a => !a.trim().startsWith('#'))
        .join(' ') : '')}`).sync()
    }
  }

}

export function autobuild(project: Project, watch = false, exit = true) {

  const autobuild = new AutoActions(project);
  autobuild.build(watch)
  if (exit) {
    process.exit(0)
  }
}



export default {
  $AUTOBUILD: (args: string) => {
    autobuild(Project.Current, !!args.split(' ').find(a => a == 'watch'))
  },
  $AUTOBUILD_WATCH: () => {
    autobuild(Project.Current, true)
  },
  $AUTOBUILDWATCH: () => {
    autobuild(Project.Current, true)
  }

}
//#endregion
