//#region @backend
import * as lockfile from 'lockfile';
import * as fse from 'fs-extra';
import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';
import * as  psList from 'ps-list';


import { Project } from './project/base-project';
import { config } from './config';
import { ProjectFrom } from './index';
import { questionYesNo, killProcess } from './process';
import { run } from './process';
import { BuildOptions } from './models';
import { info } from './messages';

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

  private save() {


    // console.log('instances to save', this.instances.map(f => f.project.name))
    fse.writeJSONSync(this.jsonWithProjectsPath, this.instances.map(ins => {
      if (ins.buildOptions) {
        ins.buildOptions = _.mergeWith({}, _.omit(ins.buildOptions, ['copyto', 'forClient']))
      }

      return ins;
    }), {
        encoding: 'utf8',
        spaces: 2
      })
  }

  private async update() {
    const ps: PsListInfo[] = await psList();
    // console.log('ps', ps)

    this.instances.forEach(ins => {
      const ii = ps.find(processInfo => processInfo.pid == ins.pid)
      if (!ii) {
        ins.pid = null;
        ins.buildOptions = null;
      }
    })
  }


  check(buildOptions: BuildOptions): Promise<ProjectInstance> {

    return new Promise(async (resolve) => {



      this.jsonWithProjectsPath = path.join(Project.Tnp.location, 'bin/projects.json');
      setTimeout(async () => {


        let projecBuild: Project = this.project;
        let pid: number = process.pid;

        this.lock()
        this.load()

        await this.update()

        let projectInstance = this.instances.find(p => p.project.location === projecBuild.location)
        if (projectInstance) {

          if (_.isNumber(projectInstance.pid)) {
            await this.action(projectInstance, () => {
              // replace process with current
              const pidToKill = projectInstance.pid;
              projectInstance.pid = process.pid;
              projectInstance.buildOptions = buildOptions;
              console.log(`Kill build process on pid ${pidToKill} for ${projectInstance.project.name}`)
              killProcess(pidToKill)
            });
          } else {
            projectInstance.pid = pid;
            projectInstance.buildOptions = buildOptions;
            this.save()
          }
        } else {
          projectInstance = new ProjectInstance(projecBuild.location, pid);
          projectInstance.buildOptions = buildOptions;
          this.instances.push(projectInstance)
          this.save()
        }

        resolve(projectInstance)
      })
    })

  }

  private async action(instance: ProjectInstance, cbKill: () => void) {
    if (this.project.isStandaloneProject || this.project.env.config.name === 'local') {
      await questionYesNo(`There is active build instance of project in this location:

      ${this.project.location}
      
      on pid: ${instance.pid}

      with build options: 
      ${JSON.stringify(_.omit(instance.buildOptions, ['copyto', 'forClient']))}
      
      Do you wanna kill it ?`

        , () => {
          cbKill()
        }, () => {
          console.log(`Exiting process, busy location: ${instance.location}`)
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


export class ProjectInstance {

  constructor(
    public readonly location?: string,
    public pid?: number,
    public buildOptions?: BuildOptions
  ) {

  }



  kill() {
    info(`Killing instance of project "${this.project.name}" build instance on pid: ${this.pid}`)
    try {
      run(`kill -9 ${this.pid}`).sync()
    } catch (error) {
      console.info('Not successfull process killing...')
    }

  }
  get project() {
    return ProjectFrom(this.location);
  }
}





//#endregion
