//#region @backend
import * as lockfile from 'lockfile';
import * as fse from 'fs-extra';
import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';
import * as  psList from 'ps-list';
import * as notif from 'node-notifier';


import { Project } from './project/base-project';
import { config } from './config';
import { ProjectFrom } from './index';
import { questionYesNo, killProcess } from './process';
import { run } from './process';
import { BuildOptions } from './models';
import { info } from './messages';
import { init } from './scripts/INIT';


export interface PsListInfo {
  pid: number;
  ppid: number;
  memory: number;
  cpu: number;
  name: string;
  cmd: string;

}

export class ProjectsChecker {
  private jsonWithProjectsPath: string;
  constructor(public project: Project) {

  }

  private instances: ProjectInstance[] = [];
  private load() {

    let json = fse.readJsonSync(this.jsonWithProjectsPath) as any[];
    json = json.map(f => _.merge(new ProjectInstance(), f))
    this.instances = json;
  }

  private save(isAppBuild = true) {

    // console.log('instances to save', this.instances.map(f => f.project.name))
    fse.writeJSONSync(this.jsonWithProjectsPath, this.instances.map(ins => {
      const buildOptions = (isAppBuild ? ins.build.app.buildOptions : ins.build.lib.buildOptions)
      if (buildOptions) {
        const newBuildOptions = _.mergeWith({}, _.omit(buildOptions, ['copyto', 'forClient']))
        if (isAppBuild) {
          ins.build.app.buildOptions = newBuildOptions;
        } else {
          ins.build.lib.buildOptions = newBuildOptions;
        }
      }

      return ins;
    }), {
        encoding: 'utf8',
        spaces: 2
      })
  }

  private async update(isAppBuild: boolean) {
    const ps: PsListInfo[] = await psList();
    // console.log('ps', ps)

    this.instances.forEach(ins => {
      const instancLib = ps.find(processInfo => processInfo.pid == ins.build.lib.pid)
      if (!instancLib) {
        ins.build.lib.pid = undefined;
        ins.build.lib.buildOptions = undefined;
      }

      const instancApp = ps.find(processInfo => processInfo.pid == ins.build.app.pid)
      if (!instancApp) {
        ins.build.app.pid = undefined;
        ins.build.app.buildOptions = undefined;
      }

    })
  }

  killAndClear() { // MAKE IT ASYNC

  }

  async check(buildOptions: BuildOptions) {

    return new Promise(async (resolve) => {



      this.jsonWithProjectsPath = path.join(Project.Tnp.location, 'bin/projects.json');
      setTimeout(async () => {


        let projecBuild: Project = this.project;
        let processPid: number = process.pid;

        this.lock()
        this.load()

        await this.update(buildOptions.appBuild);

        let projectInstance = this.instances.find(p => p.project.location === projecBuild.location)
        if (projectInstance) {

          const pidApp = projectInstance.build.app.pid;
          const pidLib = projectInstance.build.lib.pid;

          if ((_.isNumber(pidApp) && buildOptions.appBuild) || (_.isNumber(pidLib) && !buildOptions.appBuild)) {
            await this.action(projectInstance, buildOptions.appBuild, () => {
              const pidToKill = buildOptions.appBuild ? projectInstance.build.app.pid : projectInstance.build.lib.pid
              if (buildOptions.appBuild) {
                projectInstance.build.app.pid = process.pid;
                projectInstance.build.app.buildOptions = buildOptions;
              } else {
                projectInstance.build.lib.pid = process.pid;
                projectInstance.build.lib.buildOptions = buildOptions;
              }


              console.log(`Kill build process on pid ${pidToKill} for ${projectInstance.project.name}`)
              killProcess(pidToKill)
            })
          }
        } else {
          projectInstance = new ProjectInstance(projecBuild.location);
          if (buildOptions.appBuild) {
            projectInstance.build.app.buildOptions = buildOptions;
            projectInstance.build.app.pid = processPid;
          } else {
            projectInstance.build.lib.buildOptions = buildOptions;
            projectInstance.build.lib.pid = processPid;
          }

          this.instances.push(projectInstance)
        }
        this.save()
        resolve()
      })
    })

  }

  private async isLocalEnv(): Promise<boolean> {
    if (!this.project.env.config) {
      await init('').project(this.project);
    }
    return this.project.env.config.name === 'local'
  }

  private async action(alreadyWorkingInstance: ProjectInstance, appBuild: boolean, cbKill: () => void) {

    if (this.project.isStandaloneProject || await this.isLocalEnv()) {

      const pidApp = alreadyWorkingInstance.build.app.pid;
      const pidLib = alreadyWorkingInstance.build.lib.pid;
      let info = ''
      if (appBuild) {
        info = `
        app build on pid: ${pidApp}
        with build options:
        ${JSON.stringify(_.omit(alreadyWorkingInstance.build.app.buildOptions, ['copyto', 'forClient']), null, 4)}
        `
      } else {
        info = `
        lib build on pid: ${pidLib}
        with build options:
        ${JSON.stringify(_.omit(alreadyWorkingInstance.build.lib.buildOptions, ['copyto', 'forClient']), null, 4)}
        `
      }

      await questionYesNo(`There is active build instance of project in this location:

      ${this.project.location}
      ${info}
      Do you wanna kill it ?`

        , () => {
          cbKill()
        }, () => {
          console.log(`Exiting process, busy location: ${alreadyWorkingInstance.location}`)
          process.exit(0)
        });
    } else {
      cbKill()
    }
  }

  lock(): boolean {

    if (!fs.existsSync(this.jsonWithProjectsPath)) {
      this.instances = [];
      fse.writeJsonSync(this.jsonWithProjectsPath, []);
      return;
    }


    if (lockfile.checkSync(this.jsonWithProjectsPath)) {
      setTimeout(() => {
        this.lock()
      })
      return;
    }
    lockfile.lockSync(this.jsonWithProjectsPath);
  }


}

export type BuildData = {
  buildOptions: BuildOptions;
  pid: number;
};

export class ProjectInstance {

  public build: {
    app: BuildData;
    lib: BuildData;
  } = { app: {}, lib: {} } as any


  constructor(
    public readonly location?: string) {
  }



  kill() {
    const pidLib = this.build.lib.pid
    const pidApp = this.build.app.pid
    info(`Killing app,lib build instances of "${this.project.name}" on pids: ${pidApp}, ${pidLib}`)
    try {
      run(`kill -9 ${pidLib}`).sync()
      run(`kill -9 ${pidApp}`).sync()
    } catch (error) {
      console.info('Not successfull process killing...')
    }

  }
  get project() {
    return ProjectFrom(this.location);
  }
}





//#endregion
