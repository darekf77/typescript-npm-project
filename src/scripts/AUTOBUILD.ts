import * as fse from "fs-extra";
import * as path from 'path';
import * as os from 'os';
import * as _ from 'lodash';

import { Project, ProjectFrom } from "../project";
import { error } from '../messages';
import { clearConsole } from '../process';

export interface ProjectForAutoBuild {
  cwd: string,
  command: string;
  commandWatch: string;
  args?: string[];
}

export interface AutoBuildUser {
  builds?: ProjectForAutoBuild[];
}

export interface AutoBuildConfigComputer {
  [userName: string]: AutoBuildUser;
}

export interface JSONAutoBuildConfig {
  [computerNames: string]: AutoBuildConfigComputer | string;
}

export class AutoBuild {


  readonly config: JSONAutoBuildConfig;



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

  build(watch = false) {
    console.log('config', this.config)
    const hostname = this.hostname;
    const username = os.userInfo().username.toLowerCase();
    console.log('hostname', hostname)
    console.log('username', username)
    const build = this.config[hostname][username].builds
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
      this.project.run(`${watch ? build.commandWatch : build.command} ${(_.isArray(build.args) ? build.args.join(' ') : '')}`).sync()
    }
  }

}

export function autobuild(project: Project, watch = false) {

  const autobuild = new AutoBuild(project);
  autobuild.build(watch)
  process.exit(0)
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
