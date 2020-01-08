//#region @backend
import * as _ from 'lodash';
import * as path from 'path';
import chalk from 'chalk';
import { Project } from '../abstract/project';
import { config } from '../../config';
import { BuildOptions } from '../features';
import * as inquirer from 'inquirer';
import { Helpers } from 'tnp-helpers';
import { TnpDB } from 'tnp-db';

export async function selectClients(buildOptions: BuildOptions, currentProject: Project, angularLib = false) {
  if (!buildOptions.watch) {
    buildOptions.forClient = currentProject.parent.children
      .filter(c => config.allowedTypes.app.includes(c.type))
      .filter(c => !_.isUndefined(c.env.config.workspace.projects.find(p => p.name === c.name))) as any;
    // .filter(c => c.name !== currentProject.name)
    return;
  }
  const choices = currentProject.parent.children
    .filter(c => config.allowedTypes.app.includes(c.type))
    .map(c => {
      const notIncludedInEnv = (!c || !c.env || !c.env.config) ? true :
        !_.isUndefined(c.env.config.workspace.projects.find(p => p.name === c.name));
      return {
        value: c.name,
        name: `${c.name}${!notIncludedInEnv ? chalk.red(' -> not included in environment.js config') : ''}`
      };
    });
  let selectedChoices = choices.map(c => c.value);

  if (global.tnpNonInteractive) {
    buildOptions.buildForAllClients = true;
  }

  if (buildOptions.buildForAllClients) {
    buildOptions.forClient = selectedChoices.map(p => Project.From(path.join(currentProject.location, '..', p))) as any;
  } else {
    Helpers.info('Please select at lease one client..')
    const { projects = [] }: { projects: string[] } = await inquirer
      .prompt([
        {
          type: 'checkbox',
          name: 'projects',
          message: 'Select target projects to build library: ',
          choices
        }
      ]) as any;
    selectedChoices = projects;
    buildOptions.forClient = selectedChoices.map(p => Project.From(path.join(currentProject.location, '..', p))) as any;
  }

  const db = await TnpDB.Instance(config.dbLocation);
  await db.transaction.updateCommandBuildOptions(currentProject.location, buildOptions);
  await db.transaction.updateBuildOptions(buildOptions, process.pid);
}

//#endregion
