//#region @backend
import * as _ from 'lodash';
import chalk from 'chalk';
import * as fse from 'fs-extra';
import * as path from 'path';

import { Project } from '../../abstract';
import { config } from '../../../config';
import { Helpers, Condition } from 'tnp-helpers';
import { TnpDB } from 'tnp-db';

export function presskeys(project: Project) {
  return ` or press on keyboard: (${chalk.bold('CMD|Ctrl')} + ${chalk.bold('Shift')} + ${chalk.bold('B')})
  in ${chalk.bold(project.name)} vscode window...
`
}


function distRequredCondition(requiredWithBuilds: Project[], context: Condition, project: Project, targets: Project[]) {

  // console.log('childs', childs.map(c => c.name))
  for (let index = 0; index < requiredWithBuilds.length; index++) {
    const c = requiredWithBuilds[index];
    const targetsAreNotReady = (targets.filter(t => {
      return c.isReadyForTarget(t);
    }).length < targets.length);

    if (targetsAreNotReady) {
      const targetsString = targets.map(t => {
        return `--forClient ${t.name}`;
      }).join(' ');
      context.errorMessage = `

      Please build project ${chalk.bold(c.name)}:
        ${config.frameworkName} bdw ${targetsString}

      ${presskeys(c)}

        `;
      return false;
    }
  }
  return true;
}

export async function waitForRequiredDistsBuilds(db: TnpDB, project: Project, targets: Project[]) {
  if (project.isGenerated) {
    return;
  }
  const conditionDist: Condition = {
    name: `Dist finsh buildProjectErr`,
    callback: async (context) => {
      const childs = project.libsForTraget(project);
      return distRequredCondition(childs, context, project, targets);
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

    ${presskeys(project)}

    `,
    timeoutNext: 10000
  };

  const browserFolder: Condition = {
    name: 'browser folder',
    callback: () => {
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
        const childs = project.sortedRequiredWorkspaceDependencies;
        return distRequredCondition(childs, context, project, [project]);
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
