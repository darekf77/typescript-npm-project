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

export async function selectClients(buildOptions: BuildOptions, currentProject: Project, db: TnpDB) {
  if (currentProject.isGenerated) {
    buildOptions.buildForAllClients = true;
    if (currentProject.isWorkspaceChildProject || currentProject.isStandaloneProject) {
      const parent = currentProject.isStandaloneProject ? currentProject.grandpa : currentProject.parent;
      buildOptions.forClient = parent.children.
        filter(c => config.allowedTypes.app.includes(c.type))
        .filter(c => {
          if (parent.isContainer) {
            return true;
          }
          return !_.isUndefined(c.env.config.workspace.projects.find(p => p.name === c.name));
        }) as any;
      return;
    }
  }
  if (
    ((buildOptions.buildForAllClients && global.tnpNonInteractive) ||
      (!buildOptions.buildForAllClients && !global.tnpNonInteractive)) &&
    buildOptions.forClient.length === 0
  ) {
    await selectClientsAutomaticly(buildOptions, currentProject, db);
  }
  if (!currentProject.isStandaloneProject && buildOptions.forClient.length === 0) {
    while (buildOptions.forClient.length === 0) {
      await selectClientsMenu(buildOptions, currentProject, db);
    }
  }
}

async function selectClientsAutomaticly(buildOptions: BuildOptions, currentProject: Project, db: TnpDB) {
  const founded = await db.appBuildFoundedFor(currentProject as any);
  if (founded.length > 0) {
    buildOptions.forClient = founded.map(c => c.project);
    Helpers.info(`

    Automaticly assigne dist build target: ${founded.map(c => chalk.bold(c.project && c.project.name))}

    `);

    await db.transaction.updateCommandBuildOptions(currentProject.location, buildOptions);
    await db.transaction.updateBuildOptions(buildOptions, process.pid);
  }
}

async function selectClientsMenu(buildOptions: BuildOptions, currentProject: Project, db: TnpDB) {
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

  await db.transaction.updateCommandBuildOptions(currentProject.location, buildOptions);
  await db.transaction.updateBuildOptions(buildOptions, process.pid);
}

//#endregion
