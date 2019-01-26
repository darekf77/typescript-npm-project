import * as _ from 'lodash';
import * as path from 'path';
import * as fse from 'fs-extra';
import { Project } from '../../project/base-project';
import { ProjectFrom } from '../../project';
import { DbCrud } from '../db-crud';
import { BaseController } from './base-controlller';

export class ProjectsController extends BaseController {

  async addExisted() {
    this.discoverProjectsInLocation(path.resolve(path.join(Project.Tnp.location, '..')))
    this.discoverProjectsInLocation(path.resolve(path.join(Project.Tnp.location, 'projects')))
  }

  addIfNotExists(project: Project): boolean {

    if (!project) {
      return
    }

    if (this.crud.addIfNotExist<any>(project as any)) {
      if (_.isArray(project.children)) {
        project.children.forEach(c => this.addIfNotExists(c))
      }
      this.addIfNotExists(project.preview)
    }
  }

  discoverProjectsInLocation(location: string) {
    // this.discoverFrom(Project.Tnp);
    fse.readdirSync(location)
      .map(name => path.join(location, name))
      .map(location => {
        // console.log(location)
        return ProjectFrom(location)
      })
      .filter(f => !!f)
      .filter(f => {
        // console.log(`Type for ${f.name} === ${f.type}`)
        return f.type !== 'unknow-npm-project'
      })
      .forEach(project => {
        // console.log(project.name)
        this.addIfNotExists(project)
      })
  }

}
