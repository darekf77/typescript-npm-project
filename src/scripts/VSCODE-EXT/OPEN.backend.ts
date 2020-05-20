import * as _ from 'lodash';
import * as express from 'express';
import * as path from 'path';
import * as fse from 'fs-extra';

import { Project } from '../../project';
import { config } from '../../config';
import { Helpers } from 'tnp-helpers';
import { Models } from 'tnp-models';
import chalk from 'chalk';


function $OPEN_WORKSPACE() {
  const workspacePath = path.join(Project.Current.location);
  if (!fse.existsSync(workspacePath)) {
    Project.Current.recreateCodeWorkspace();
  }
  Project.Current.run(`code ${Project.Current.location} &`).sync();
  process.exit(0)
}

function $OPEN_WORKSPACE_CHILDS() {
  let proj: Project;
  if (Project.Current.isWorkspace) {
    proj = Project.Current;
  } else if (Project.Current.isWorkspaceChildProject) {
    proj = Project.Current.parent;
  }
  if (proj.isWorkspace) {
    proj.run(`${proj.children.map(c => `code ${c.name}`).join(' && ')}`).sync();
  }
  process.exit(0)
}

function $IS_CORE_PROJECT() {
  Helpers.info(`(${Project.Current.genericName})
  - is core project: ${chalk.bold(String(Project.Current.isCoreProject))}`)
  process.exit(0)
}

function $OPEN_CORE_PROJECT() {
  if (Project.Current.isCoreProject && Project.Current.frameworkVersionAtLeast('v2')) {
    Project.Current.run(`code ${Project.by(Project.Current._type, Project.Current.frameworkVersionMinusOne).location} &`).sync();
  } else {
    Project.Current.run(`code ${Project.by(Project.Current._type, Project.Current._frameworkVersion).location} &`).sync();
  }
  process.exit(0)
}

function $OPEN_TNP_PROJECT() {
  Project.Tnp.run(`code ${Project.Tnp.location} &`).sync();
  process.exit(0)
}

function $OPEN_BASELINE() {
  if (Project.Current.isSite) {
    if (Project.Current.isWorkspace) {
      Project.Current.baseline.run(`code ${Project.Current.baseline.location} &`).sync();
    } else {
      Project.Current.baseline.run(`code . &`).sync();
    }
    process.exit(0)
  }
  Helpers.error(`This is not "site project"`, false, true);
}

export default {
  $OPEN_WORKSPACE_CHILDS: Helpers.CLIWRAP($OPEN_WORKSPACE_CHILDS, '$OPEN_WORKSPACE_CHILDS'),
  $OPEN_WORKSPACE: Helpers.CLIWRAP($OPEN_WORKSPACE, '$OPEN_WORKSPACE'),
  $IS_CORE_PROJECT: Helpers.CLIWRAP($IS_CORE_PROJECT, '$IS_CORE_PROJECT'),
  $OPEN_CORE_PROJECT: Helpers.CLIWRAP($OPEN_CORE_PROJECT, '$OPEN_CORE_PROJECT'),
  $OPEN_TNP_PROJECT: Helpers.CLIWRAP($OPEN_TNP_PROJECT, '$OPEN_TNP_PROJECT'),
  $OPEN_BASELINE: Helpers.CLIWRAP($OPEN_BASELINE, '$OPEN_BASELINE'),
}
