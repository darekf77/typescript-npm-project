//#region @backend
import * as _ from 'lodash';
import * as path from 'path';
import { Project } from './abstract/project';
import { config } from '../config';
import { BuildOptions } from './features/build-options';
import * as inquirer from 'inquirer';
import { info } from '../helpers';
import { TnpDB } from '../tnp-db';

export async function selectClients(buildOptions: BuildOptions, currentProject: Project, angularLib = false) {
  if (!buildOptions.watch) {
    buildOptions.forClient = currentProject.parent.children
      .filter(c => config.allowedTypes.app.includes(c.type))
      .filter(c => !_.isUndefined(c.env.config.workspace.projects.find(p => p.name === c.name)))
      .filter(c => c.name !== currentProject.name)
    return;
  }
  info('Please select at lease one client..')
  const { projects = [] }: { projects: string[] } = await inquirer
    .prompt([
      {
        type: 'checkbox',
        name: 'projects',
        message: 'Select target projects to build library: ',
        choices: currentProject.parent.children
          .filter(c => config.allowedTypes.app.includes(c.type))
          .filter(c => !_.isUndefined(c.env.config.workspace.projects.find(p => p.name === c.name)))
          .filter(c => {
            if (angularLib) {
              return true;
            }
            return c.name !== currentProject.name;
          })
          .map(c => {
            return { value: c.name, name: c.name }
          })
      }
    ]) as any;

  buildOptions.forClient = projects.map(p => Project.From(path.join(currentProject.location, '..', p)))

  const db = await TnpDB.Instance;
  await db.transaction.updateCommandBuildOptions(currentProject.location, buildOptions);

}

//#endregion
