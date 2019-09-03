import * as _ from 'lodash';
import * as express from 'express';
import * as path from 'path';
import * as fse from 'fs-extra';

import { Project } from '../../project';
import { config } from '../../config';
import { Helpers } from '../../helpers';
import { Models } from '../../models';
import chalk from 'chalk';


export default {
  $OPEN_WORKSPACE() {
    const workspacePath = path.join(Project.Current.location, Project.Current.nameOfCodeWorkspace);
    if (!fse.existsSync(workspacePath)) {
      Project.Current.recreateCodeWorkspace();
    }
    Project.Current.run(`code ${Project.Current.nameOfCodeWorkspace} &`).sync();
    process.exit(0)
  },
  $OPEN_CORE_PROJECT() {
    Project.Current.run(`code ${Project.by(Project.Current.type).location} &`).sync();
    process.exit(0)
  },
  $OPEN_TNP_PROJECT() {
    Project.Tnp.run(`code ${Project.Tnp.location} &`).sync();
    process.exit(0)
  },
  $OPEN_BASELINE() {
    if (Project.Current.isSite) {
      if (Project.Current.isWorkspace) {
        Project.Current.baseline.run(`code ${Project.Current.baseline.nameOfCodeWorkspace} &`).sync();
      } else {
        Project.Current.baseline.run(`code . &`).sync();
      }
      process.exit(0)
    }
    Helpers.error(`This is not "site project"`, false, true);
  },
}
