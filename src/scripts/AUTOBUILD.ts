import * as fse from "fs-extra";
import * as path from 'path';
import * as os from 'os';
import * as _ from 'lodash';

import { Project, ProjectFrom } from "../project";
import { error, info } from '../messages';
import { clearConsole } from '../process';

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
    const release: ProjectForAutoRelease = (this.config[hostname][username].autorelease as ProjectForAutoRelease[])
      .find(b => {
        return path.resolve(b.cwd) === path.resolve(this.project.location)
      });
    if (!release) {
      error(`No autorelease for current project.`)
    }

    this.project.run(`${release.command} ${(_.isArray(release.args) ? release.args
      .filter(a => !a.trim().startsWith('#'))
      .join(' ') : '')}`).sync()

    info(`Done`);
  }

  build(watch = false) {
    console.log('config', this.config)
    const hostname = this.hostname;
    const username = os.userInfo().username.toLowerCase();
    console.log('hostname', hostname)
    console.log('username', username)
    const build: ProjectForAutoBuild = this.config[hostname][username].builds
      .find(b => {
        const p = ProjectFrom(b.cwd);
        console.log(`Project in "${b.cwd}" is "${p && p.name}"`)
        if (!p) {
          error(`Please fix your autobuild.json`);
        }
        return path.resolve(p.location) === path.resolve(this.project.location)
      });

    console.log('build', build)
    if (!build) {
      error(`Not build for current project "${this.project.name}"   `)
    } else {
      clearConsole();
      this.project.git.updateOrigin();
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
