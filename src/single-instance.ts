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
import { run } from './process';
import { BuildOptions } from './models';

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
    fse.writeJSONSync(this.jsonWithProjectsPath, this.instances, {
      encoding: 'utf8',
      spaces: 2
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

        let projectInstance = this.instances.find(p => p.project.location === projecBuild.location)
        if (!projectInstance) {
          projectInstance = new ProjectInstance(projecBuild.location, pid);
          this.instances.push(projectInstance)
        }
        projectInstance.buildOptions = buildOptions;

        await projectInstance.update()

        this.save()
        resolve(projectInstance)
      })
    })

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

  async update() {
    const ps: PsListInfo[] = await psList();
    console.log('ps', ps)
    let info = ps.find(p => p.pid == this.pid);
    console.log('Info from system: ', info)
    if (!info) {
      this.pid = null;
    }
    return info;
  }

  kill() {
    run(`kill -g ${this.pid}`).sync()
  }
  get project() {
    return ProjectFrom(this.location);
  }
}





//#endregion
