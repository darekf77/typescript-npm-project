//#region imports
import * as _ from 'lodash';
import * as path from 'path';
import chalk from 'chalk';
import { Project } from '../abstract/project';
import { config } from '../../config';
import { BuildOptions } from 'tnp-db';
import * as inquirer from 'inquirer';
import { Helpers } from 'tnp-helpers';
import { TnpDB } from 'tnp-db';
//#endregion

/**
 * Resovle workspace child clients if needed
 */
export async function selectClients(buildOptions: BuildOptions, currentProject: Project, db: TnpDB) {

  if (!currentProject.isWorkspaceChildProject || buildOptions.forClient.length > 0) {
    return;
  }

  if (!buildOptions.watch || buildOptions.buildForAllClients || global.tnpNonInteractive) {
    buildOptions.forClient = currentProject.parent.children
      .filter(c => c.typeIs(...config.allowedTypes.app))
      .filter(c => !_.isUndefined(c.env.config.workspace.projects.find(p => p.name === c.name))) as any;
    return;
  }

  await selectClientsMenu(buildOptions, currentProject, db);
  Helpers.info(`

  [selectClients] Selected Clients: ${(buildOptions.forClient as any as Project[]).map(c => c.name).join(',')}

  `);
}

//#region clients autocomplete menu
async function selectClientsMenu(buildOptions: BuildOptions, currentProject: Project, db: TnpDB) {
  if (!currentProject.isWorkspaceChildProject) {
    return;
  }

  const menu = async () => {

    const choices = currentProject.parent.children
      .filter(c => c.typeIs(...config.allowedTypes.app))
      .map(c => {
        const notIncludedInEnv = (!c || !c.env || !c.env.config) ? true :
          !_.isUndefined(c.env.config.workspace.projects.find(p => p.name === c.name));
        return {
          value: c.name,
          name: `${c.name}${!notIncludedInEnv ? chalk.red(' -> not included in environment.js config') : ''}`
        };
      });
    let selectedChoices = choices.map(c => c.value);

    if (buildOptions.buildForAllClients) {
      buildOptions.forClient = selectedChoices.map(p => Project.From<Project>(path.join(currentProject.location, '..', p))) as any;
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
      buildOptions.forClient = selectedChoices.map(p => Project.From<Project>(path.join(currentProject.location, '..', p))) as any;
    }

    await db.updateCommandBuildOptions(currentProject.location, buildOptions);
    await db.updateBuildOptions(buildOptions, process.pid);
  }

  while (buildOptions.forClient.length === 0) {
    menu();
  }

}
//#endregion
