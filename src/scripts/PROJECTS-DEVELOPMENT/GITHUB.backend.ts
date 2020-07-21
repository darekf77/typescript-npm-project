import * as path from 'path';
import * as fse from 'fs-extra';

import chalk from 'chalk';
import { Project } from '../../project';
import { Helpers } from 'tnp-helpers';

const ADDRESS_GITHUB_SSH = ''; // TODO @LAST FIX THISC

const ADDRESS_GITHUB = ADDRESS_GITHUB_SSH;
const NPM_PROJCETS_LOCATION = path.resolve(path.join((Project.Tnp as Project).location, '..'));
const GITHUB_PROJECTS_NAMES = []; // TODO @LAST FIX THISC

export type TAction = 'clone' | 'pull';


export async function $GITHUB_DUMP(args: string, exit = true) {

  for (let index = 0; index < GITHUB_PROJECTS_NAMES.length; index++) {
    const projectName = GITHUB_PROJECTS_NAMES[index];
    const githubGitUrl = `${ADDRESS_GITHUB}${projectName}`;
    let action: TAction = 'clone';
    const dest = path.join(NPM_PROJCETS_LOCATION, projectName);

    const process = async (retry = false) => {
      Helpers.info(`${retry ? '' : '\n\n'} --- ${retry ? 'Retrying' : 'Starting'
        } dump of ${chalk.underline(projectName)} --- ${retry ? '' : '\n\n'}`)
      action = fse.existsSync(dest) ? 'pull' : 'clone';
      try {
        const dest = path.join(NPM_PROJCETS_LOCATION, projectName);
        if (action === 'pull') {
          let proj: Project;
          while (!proj) {
            proj = Project.From<Project>(dest);
            if (!proj) {
              Helpers.run(`code ${dest}`).async();
              Helpers.pressKeyAndContinue(`Fix metadata/package.json of project ${
                chalk.bold(projectName)} to continue and press any key`)
            }
          }
          if (proj.git.thereAreSomeUncommitedChange) {
            Helpers.run(`code ${dest}`).async();
            Helpers.pressKeyAndContinue(`Prepare project ${chalk.bold(projectName)} to pull ` +
              `from git press any key to try again`)
          }
          proj.git.pullCurrentBranch();
          Helpers.info(`Pull new origin for ${projectName}`);
        } else {
          Helpers.run(`git clone ${githubGitUrl}`, { cwd: NPM_PROJCETS_LOCATION }).sync();
          Helpers.info(`Cloned origin for ${projectName}`);
        }
      } catch (err) {
        // Helpers.error(err, true);
        Helpers.run(`code ${dest}`).async();
        const tryAgain = await Helpers.questionYesNo(`Try again dump project ${projectName} ?`);
        if (tryAgain) {
          await process(true);
        } else {
          Helpers.info(`Skipping project ${chalk.underline(projectName)}`);
        }
      }
    }
    await process();
  }
  if (exit) {
    process.exit(0)
  }
}


export async function $GITHUB_PUSH(args: string, exit = true) {
  global.hideLog = false;
  for (let index = 0; index < GITHUB_PROJECTS_NAMES.length; index++) {
    const projectName = GITHUB_PROJECTS_NAMES[index];
    Helpers.log(`Checking project ${chalk.bold(projectName)}.`);
    const githubGitUrl = `${ADDRESS_GITHUB_SSH}${projectName}`;
    const dest = path.join(NPM_PROJCETS_LOCATION, projectName);
    const proj = Project.From<Project>(dest);
    if (proj.git.thereAreSomeUncommitedChange) {
      Helpers.run(`code .`, { cwd: dest }).async();
      Helpers.pressKeyAndContinue(`${chalk.bold(projectName)} - there are some uncommited changes.. please commit and press any key..`);
    }
    if (proj.git.currentBranchName !== 'master') {
      Helpers.run(`code .`, { cwd: dest }).async();
      Helpers.pressKeyAndContinue(`${chalk.bold(projectName)} - default branch is not master.. please commit and press any key..`);
    }
    while (true) {
      try {
        Helpers.log(`Pushing project  ${chalk.bold(projectName)}...`);
        proj.git.pushCurrentBranch();
        break;
      } catch (err) {
        Helpers.error(`Not able to push brench... `, true, true);
        Helpers.run(`code .`, { cwd: dest }).async();
        Helpers.pressKeyAndContinue(`${chalk.bold(projectName)} - check your repository and press any key..`);
      }
    }

    Helpers.info(`Success push of project ${chalk.bold(projectName)}.`)
  }
  if (exit) {
    process.exit(0);
  }
}

export async function $GITHUB_PULL(args: string, exit = true) {
  await $GITHUB_DUMP(args, exit);
}

function $GITHUB_LIST_ORIGINS() {
  for (let index = 0; index < GITHUB_PROJECTS_NAMES.length; index++) {
    const projectName = GITHUB_PROJECTS_NAMES[index];
    Helpers.log(`Checking project ${chalk.bold(projectName)}.`);
    const githubGitUrl = `${ADDRESS_GITHUB_SSH}${projectName}`;
    const dest = path.join(NPM_PROJCETS_LOCATION, projectName);
    const proj = Project.From<Project>(dest);
    if (proj) {
      Helpers.info(proj.git.originURL);
    }

  }
  // git config --get remote.origin.url
  process.exit(0);
}

export default {
  $GITHUB_LIST_ORIGINS: Helpers.CLIWRAP($GITHUB_LIST_ORIGINS, '$GITHUB_LIST_ORIGINS'),
  $GITHUB_DUMP: Helpers.CLIWRAP($GITHUB_DUMP, '$GITHUB_DUMP'),
  $GITHUB_PUSH: Helpers.CLIWRAP($GITHUB_PUSH, '$GITHUB_PUSH'),

  $GITHUB_PULL: Helpers.CLIWRAP($GITHUB_PULL, '$GITHUB_PULL'),
}
