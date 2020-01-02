import * as _ from 'lodash';
import * as express from 'express';
import * as path from 'path';
import * as fse from 'fs-extra';

import { Project } from '../../project';
import { config } from '../../config';
import { Helpers } from 'tnp-helpers';
import { Models } from 'tnp-models';
import chalk from 'chalk';
import { CLIWRAP } from '../cli-wrapper.backend';

function $OPEN_WORKSPACE() {
  const workspacePath = path.join(Project.Current.location, Project.Current.nameOfCodeWorkspace);
  if (!fse.existsSync(workspacePath)) {
    Project.Current.recreateCodeWorkspace();
  }
  Project.Current.run(`code ${Project.Current.nameOfCodeWorkspace} &`).sync();
  process.exit(0)
}

function $IS_CORE_PROJECT() {
  Helpers.info(`(${Project.Current.genericName})
  - is core project: ${chalk.bold(String(Project.Current.isCoreProject))}`)
  process.exit(0)
}

function $OPEN_CORE_PROJECT() {
  if (Project.Current.isCoreProject && Project.Current.frameworkVersion !== 'v1') {
    Project.Current.run(`code ${Project.by(Project.Current.type, 'v1').location} &`).sync();
  } else {
    Project.Current.run(`code ${Project.by(Project.Current.type, Project.Current.frameworkVersion).location} &`).sync();
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
      Project.Current.baseline.run(`code ${Project.Current.baseline.nameOfCodeWorkspace} &`).sync();
    } else {
      Project.Current.baseline.run(`code . &`).sync();
    }
    process.exit(0)
  }
  Helpers.error(`This is not "site project"`, false, true);
}

export default {
  $OPEN_WORKSPACE: CLIWRAP($OPEN_WORKSPACE, '$OPEN_WORKSPACE'),
  $IS_CORE_PROJECT: CLIWRAP($IS_CORE_PROJECT, '$IS_CORE_PROJECT'),
  $OPEN_CORE_PROJECT: CLIWRAP($OPEN_CORE_PROJECT, '$OPEN_CORE_PROJECT'),
  $OPEN_TNP_PROJECT: CLIWRAP($OPEN_TNP_PROJECT, '$OPEN_TNP_PROJECT'),
  $OPEN_BASELINE: CLIWRAP($OPEN_BASELINE, '$OPEN_BASELINE'),
}
