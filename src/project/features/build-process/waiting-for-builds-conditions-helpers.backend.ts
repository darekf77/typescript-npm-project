//#region @backend
import * as _ from 'lodash';
import chalk from 'chalk';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as glob from 'glob';

import { FeatureForProject, Project } from '../../abstract';
import { BuildOptions } from './build-options';
import { Models } from 'tnp-models';
import { config } from '../../../config';
import { Helpers, Condition } from 'tnp-helpers';
import { TnpDB } from 'tnp-db';
import { PROGRESS_DATA } from '../../../progress-output';
import { handleProjectsPorts } from '../environment-config/environment-config-helpers';


function distRequredCondition(childs: Project[], context: Condition, project: Project, db: TnpDB, targets: Project[]) {

  // console.log('childs', childs.map(c => c.name))
  for (let index = 0; index < childs.length; index++) {
    const c = childs[index];
    const browserFor = path.join(c.location, `browser-for-${project.name}`);
    if (!Helpers.exists(browserFor)) {
      // console.log(`Not exists ${browserFor}`)
      const targetsString = targets.map(t => {
        return `--forClient ${t.name}`; ''
      }).join(' ')
      context.errorMessage = `

      Please build project ${chalk.bold(c.name)}:
        ${config.frameworkName} bdw ${targetsString}


      or press on keyboard: (${chalk.bold('CMD|Ctrl')} + ${chalk.bold('Shift')} + ${chalk.bold('B')})
      in ${chalk.bold(c.name)} vscode window...

        `;
      return false;
    }
  }
  return true;
}

export async function waitForRequiredDistsBuilds(db: TnpDB, project: Project, targets: Project[]) {
  const conditionDist: Condition = {
    name: `Dist finsh buildProjectErr`,
    callback: async (context) => {
      const childs = project.libsForTraget(project);
      return distRequredCondition(childs, context, project, db, targets);
    },
    errorMessage: 'Please wait for dist build to finish... (workspace child project) '
  };
  await Helpers.conditionWait([
    conditionDist,
  ]);
}


export async function waitForAppBuildToBePossible(db: TnpDB, project: Project) {

  const commonCondtion: Condition = {
    name: 'common condition',
    callback: async () => {
      const founded = await db.distBuildFoundedFor(project as any);
      return _.isObject(founded);
    },
    errorMessage: `Waiting for dist build for this project:

    Please run: ${config.frameworkName} bdw

    inside this project in other console/terminal..

    `,
    timeoutNext: 10000
  };

  const browserFolder: Condition = {
    name: 'browser folder',
    callback: (context) => {
      const browserFolder = path.join(project.location, config.folder.browser);
      const result = fse.existsSync(browserFolder);
      return result;
    },
    errorMessage: `Please wait for dist build to finish (standalone project)`
  };

  if (project.isStandaloneProject) {
    await Helpers.conditionWait([
      commonCondtion,
      browserFolder,
    ])
  } else if (project.isWorkspaceChildProject) {

    const conditionDist: Condition = {
      name: `Dist finsh buildProjectErr`,
      callback: async (context) => {
        const childs = project.sortedRequiredWorkspaceChilds;
        return distRequredCondition(childs, context, project, db, [project]);
      },
      errorMessage: 'Please wait for dist build to finish... (workspace child project) '
    };

    const conditions = [
      conditionDist,
      commonCondtion,
    ];

    await Helpers.conditionWait(conditions);
  }

}
//#endregion
