//#region @backend
import * as lockfile from 'lockfile';
import * as fse from 'fs-extra';
import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';
import * as  psList from 'ps-list';
// import * as notif from 'node-notifier';
import * as jsonStrinigySafe from 'json-stringify-safe';



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

  private static instances: ProjectInstance[] = [];

  private get instances() {
    return ProjectsChecker.instances;
  }
  private load() {

    let json = fse.readJsonSync(this.jsonWithProjectsPath) as any[];
    json = json.map(f => _.merge(new ProjectInstance(), f))
    json = json.map(f => {
      const ins = f as ProjectInstance;
      ins.build.app.buildOptions = _.merge(new BuildOptions(), ins.build.app.buildOptions)
      ins.build.lib.buildOptions = _.merge(new BuildOptions(), ins.build.lib.buildOptions)
      return ins;
    })
    ProjectsChecker.instances = json;
  }

  private save(isAppBuild = true) {

    // console.log('instances to save', this.instances.map(f => f.project.name))
    const instancesToSave = this.instances.map(ins => {

      let copy = {} as ProjectInstance;
      _.merge(copy, {
        location: ins.location,
        build: {
          app: {
            buildOptions: _.merge({}, _.omit(ins.build.app.buildOptions,
              BuildOptions.PropsToOmmitWhenStringify)),
            pid: ins.build.app.pid
          },
          lib: {
            buildOptions: _.merge({}, _.omit(ins.build.lib.buildOptions,
              BuildOptions.PropsToOmmitWhenStringify)),
            pid: ins.build.lib.pid
          }
        }
      } as ProjectInstance)
      return copy;
    });

    // // console.log(instancesToSave)
    // console.log(jsonStrinigySafe(instancesToSave))
    // // process.exit(0)
    fse.writeJSONSync(this.jsonWithProjectsPath, instancesToSave, {
      encoding: 'utf8',
      spaces: 2
    })
  }

  private async update() {
    const ps: PsListInfo[] = await psList();
    // console.log('ps', ps)

    this.instances.forEach(ins => {
      const psInfoLib = ps.find(processInfo => processInfo.pid == ins.build.lib.pid)
      if (!psInfoLib) {
        ins.build.lib.pid = undefined;
        ins.build.lib.buildOptions = undefined;
      }

      const psInfoApp = ps.find(processInfo => processInfo.pid == ins.build.app.pid)
      if (!psInfoApp) {
        ins.build.app.pid = undefined;
        ins.build.app.buildOptions = undefined;
      }

    })
  }

  killAndClear() { // MAKE IT ASYNC

  }


  private checkIfActiveProjectInWorkspace(workspace: Project) {
    // console.log('this.instances', this.instances.map(i => i.location))
    const workspaceInstance = this.instances.find(f => f.location === workspace.location)

    if (workspaceInstance.isActive && !workspaceInstance.isCurrentProcess) { // TODO imposible ?
      // console.log(`Active workspace ${workspace.name}`)
      return true;
    }

    return workspace.children
      .filter(c => {
        const childInstance = this.instances.find(f => f.location === c.location)
        if (childInstance.isActive && !childInstance.isCurrentProcess) {
          // console.log(`Active workspace ${workspace.location} child ${c.name}`)
        }
        return childInstance.isActive && !childInstance.isCurrentProcess;
      }).length > 0;
  }

  foundedActivePids(onlyForThisWorkspace = false) {
    const project = onlyForThisWorkspace ? this.project : undefined;
    const pids = [];
    if (project) {
      const projectIns = this.instances.find(i => i.location === project.location)
      if (_.isNumber(projectIns.build.app.pid)) {
        pids.push(projectIns.build.app.pid)
      }
      if (_.isNumber(projectIns.build.lib.pid)) {
        pids.push(projectIns.build.lib.pid)
      }
    } else {
      this.instances.forEach(i => {
        if (_.isNumber(i.build.app.pid)) {
          pids.push(i.build.app.pid)
        }
        if (_.isNumber(i.build.lib.pid)) {
          pids.push(i.build.lib.pid)
        }
      })
    }
    return pids;
  }
  areActiveProjectsInWorkspace() {

    if (this.project.isWorkspace) {
      return this.checkIfActiveProjectInWorkspace(this.project);
    } else if (this.project.isWorkspaceChildProject) {
      return this.checkIfActiveProjectInWorkspace(this.project.parent);
    }
    return false;
  }

  async check(buildOptions: BuildOptions) {

    return new Promise(async (resolve) => {



      this.jsonWithProjectsPath = path.join(Project.Tnp.location, 'bin/projects.json');
      setTimeout(async () => {


        let projecBuild: Project = this.project;
        let processPid: number = process.pid;

        this.lock()
        this.load()

        await this.update();

        let projectInstance = this.instances.find(p => p.project.location === projecBuild.location)
        if (projectInstance) {

          const pidApp = projectInstance.build.app.pid;
          const pidLib = projectInstance.build.lib.pid;

          console.log(`Found instance of ${this.project.name}, builds: app(${pidApp}) , lib(${pidLib})`)

          if ((_.isNumber(pidApp) && buildOptions.appBuild) || (_.isNumber(pidLib) && !buildOptions.appBuild)) {
            await this.action(projectInstance, buildOptions.appBuild, () => {
              const pidToKill = buildOptions.appBuild ? projectInstance.build.app.pid : projectInstance.build.lib.pid
              if (buildOptions.appBuild) {
                projectInstance.build.app.pid = process.pid;
                projectInstance.build.app.buildOptions = _.cloneDeep(buildOptions);
              } else {
                projectInstance.build.lib.pid = process.pid;
                projectInstance.build.lib.buildOptions = _.cloneDeep(buildOptions);
              }


              console.log(`Kill build process on pid ${pidToKill} for ${projectInstance.project.name}`)
              killProcess(pidToKill)
            })
          } else {
            // update process
            if (buildOptions.appBuild) {
              projectInstance.build.app.pid = process.pid;
              projectInstance.build.app.buildOptions = _.cloneDeep(buildOptions);
            } else {
              projectInstance.build.lib.pid = process.pid;
              projectInstance.build.lib.buildOptions = _.cloneDeep(buildOptions);
            }
          }

        } else {
          projectInstance = new ProjectInstance(projecBuild.location);
          if (buildOptions.appBuild) {
            projectInstance.build.app.buildOptions = _.cloneDeep(buildOptions);
            projectInstance.build.app.pid = processPid;
          } else {
            projectInstance.build.lib.buildOptions = _.cloneDeep(buildOptions);
            projectInstance.build.lib.pid = processPid;
          }

          this.instances.push(projectInstance)
        }
        this.automaticlyAddWorkspaceInstance(this.project)
        this.save()
        console.log('** check system/pids end')
        resolve()
      })
    })

  }

  private automaticlyAddWorkspaceInstance(project: Project) {
    const workspace = project.parent;
    if (project.isWorkspaceChildProject) {
      const workspaceInstance = this.instances.find(p => p.location === workspace.location)
      if (!workspaceInstance) {
        this.instances.push(new ProjectInstance(workspace.location));
        // console.log(`Worksapce auto add from ${workspace.location}`)
      } else {
        // console.log(`Worksapce already added ${workspace.location}`)
      }
      workspace.children.forEach(c => {
        const childInstance = this.instances.find(p => p.location === c.location)
        if (!childInstance) {
          this.instances.push(new ProjectInstance(c.location));
        }
      })
    }
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
        ${alreadyWorkingInstance.build.app.buildOptions.toString()}
        `
      } else {
        info = `
        lib build on pid: ${pidLib}
        with build options:
        ${alreadyWorkingInstance.build.lib.buildOptions.toString()}
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
      ProjectsChecker.instances = [];
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

  get isActive() {
    return _.isNumber(this.build.app.pid) || _.isNumber(this.build.lib.pid);
  }

  get isCurrentProcess() {
    return (_.isNumber(this.build.app.pid) && this.build.app.pid === process.pid) ||
      (_.isNumber(this.build.lib.pid) && this.build.lib.pid === process.pid)
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
