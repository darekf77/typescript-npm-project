import * as _ from 'lodash';
import * as express from 'express';
import * as path from 'path';
import * as fse from 'fs-extra';

import { Project } from '../../project';
import { config } from '../../config';
import { Helpers } from 'tnp-helpers';
import { Models } from 'tnp-models';
import { TnpDB } from 'tnp-db';
import chalk from 'chalk';



function $OPEN_WORKSPACE() {
  const workspacePath = path.join((Project.Current as Project).location);
  if (!fse.existsSync(workspacePath)) {
    (Project.Current as Project).recreateCodeWorkspace();
  }
  (Project.Current as Project).run(`code ${(Project.Current as Project).location} &`).sync();
  process.exit(0)
}

function $OPEN_WORKSPACE_CHILDS() {
  let proj: Project;
  if ((Project.Current as Project).isWorkspace) {
    proj = Project.Current as Project;
  } else if ((Project.Current as Project).isWorkspaceChildProject) {
    proj = (Project.Current as Project).parent;
  }
  if (proj.isWorkspace) {
    proj.run(`${proj.children.map(c => `code ${c.name}`).join(' && ')}`).sync();
  }
  process.exit(0)
}

function $IS_CORE_PROJECT() {
  Helpers.info(`(${(Project.Current as Project).genericName})
  - is core project: ${chalk.bold(String((Project.Current as Project).isCoreProject))}`)
  process.exit(0)
}

function $OPEN_CORE_PROJECT() {
  if ((Project.Current as Project).isCoreProject && (Project.Current as Project).frameworkVersionAtLeast('v2')) {
    (Project.Current as Project).run(`code ${Project.by<Project>((Project.Current as Project)._type, (Project.Current as Project).frameworkVersionMinusOne).location} &`).sync();
  } else {
    (Project.Current as Project).run(`code ${Project.by<Project>((Project.Current as Project)._type, (Project.Current as Project)._frameworkVersion).location} &`).sync();
  }
  process.exit(0)
}

function $LOCATION() {
  Helpers.info(`

  ${Project.Tnp.location}

  `);
  process.exit(0)
}

function $OPEN_TNP_PROJECT() {
  (Project.Tnp as Project).run(`code ${(Project.Tnp as Project).location} &`).sync();
  process.exit(0)
}

function $OPEN_BASELINE() {
  if ((Project.Current as Project).isSite) {
    if ((Project.Current as Project).isWorkspace) {
      (Project.Current as Project).baseline.run(`code ${(Project.Current as Project).baseline.location} &`).sync();
    } else {
      (Project.Current as Project).baseline.run(`code . &`).sync();
    }
    process.exit(0)
  }
  Helpers.error(`This is not "site project"`, false, true);
}

async function $OPEN(args: string) {
  const db = await TnpDB.Instance(config.dbLocation);
  const name = _.first(args.split(' '));
  const projects = (await db.getProjects()).filter(p => {
    return ((p.project as Project).name === name) || ((p.project as Project).genericName === name)
  });
  if (projects.length > 0) {
    Helpers.run(`code ${projects.map(c => (c.project as Project).location).join(' ')}`).sync();
  } else {
    Helpers.log(`Projects not found`);
    process.exit(0)
  }

}

export default {
  $LOCATION: Helpers.CLIWRAP($LOCATION, '$LOCATION'),
  $OPEN: Helpers.CLIWRAP($OPEN, '$OPEN'),
  $OPEN_WORKSPACE_CHILDS: Helpers.CLIWRAP($OPEN_WORKSPACE_CHILDS, '$OPEN_WORKSPACE_CHILDS'),
  $OPEN_WORKSPACE: Helpers.CLIWRAP($OPEN_WORKSPACE, '$OPEN_WORKSPACE'),
  $IS_CORE_PROJECT: Helpers.CLIWRAP($IS_CORE_PROJECT, '$IS_CORE_PROJECT'),
  $OPEN_CORE_PROJECT: Helpers.CLIWRAP($OPEN_CORE_PROJECT, '$OPEN_CORE_PROJECT'),
  $OPEN_TNP_PROJECT: Helpers.CLIWRAP($OPEN_TNP_PROJECT, '$OPEN_TNP_PROJECT'),
  $OPEN_BASELINE: Helpers.CLIWRAP($OPEN_BASELINE, '$OPEN_BASELINE'),
}
