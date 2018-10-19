import * as path from 'path';
import * as fse from 'fs-extra';
import * as _ from 'lodash';

import { Project, ProjectFrom } from '../project';
import { run } from '../process';
import { $CLOUD_SELF_REBUILD_AND_RUN } from './CLOUD-self-update';
import { paramsFrom } from '../helpers';
import { error } from '../messages';


export namespace CloudHelpers {

  export function cloudProject() {
    return ProjectFrom(path.join(Project.Tnp.location, 'projects/site'));
  }

  export function cloudBuild() {
    cloudProject().run(`tnp build`, { biggerBuffer: true }).sync();
  }

  export function reinit() {
    cloudProject().run(`tnp clear`).sync();
    cloudProject().run(`tnp init --env=online`).sync();
  }

  export function cloudBuildNoOutput() {
    cloudProject().run(`tnp build`, { biggerBuffer: true }).sync();
  }

  export function cloudStartNoOutput() {
    cloudProject().run(`nohup tnp start &`).sync();
  }

  export function safeRebuildAndRun(args) {
    run(`tnp ${paramsFrom($CLOUD_SELF_REBUILD_AND_RUN.name)} ${args} &`, { biggerBuffer: true }).sync();
  }

  /**
   * Create backup of whole cloud or cloud child project
   * @param args --child <child project name>
   */
  export function createBackup(args) {

    let { child }: { child: string; } = require('minimist')(args.split(' '));
    child = (_.isString(child) ? child.trim() : child)

    let project = cloudProject();

    if (_.isString(child)) {
      project = project.children.find(p => p.name === child)
    }

    if (!project) {
      error(`Bad child name ${child} to build project`);
    }

    const cwd = path.resolve(path.join(project.location, '..'));

    try {
      run(`rimraf ${project.backupName}`, { cwd }).sync()
      run(`cp -R ${project.name} ${project.backupName}`, { cwd }).sync()
    } catch (err) {
      error(err)
    }
  }

}
