import * as path from 'path';
import * as fse from 'fs-extra';
import * as os from 'os';
import chalk from 'chalk';
import { Project } from '../../project';
import { Helpers } from '../../helpers';
import { CLIWRAP } from '../cli-wrapper.backend';
const ADDRESS_GITHUB_SSH = 'git@github.com:darekf77/';
const ADDRESS_GITHUB_HTTPS = 'https://github.com/darekf77/';
const ADDRESS_GITHUB = os.userInfo().username === 'dfilipiak' ? ADDRESS_GITHUB_HTTPS : ADDRESS_GITHUB_SSH;
const NPM_PROJCETS_LOCATION = path.resolve(path.join(Project.Tnp.location, '..'));
const GITHUB_PROJECTS_NAMES = [
  'tsc-npm-project',
  'tnp-helpers',
  'tnp-models',
  'tnp-db',
  'firedev',
  'firedev-projects',
  'ng2-rest',
  'ng2-logger',
  'morphi',
  'ng2-rest-swagger-generator',
  'incremental-compiler',
  'typescript-class-helpers',
  'json10',
  'lodash-walk-object',
  'base-model-wrap',
  'ng2-rest-docs-server',
  'isomorphic-region-loader',
  // 'aurora',

  'static-columns',
  'bs4-breakpoint',
  'button-dropdown',
  'ng2-scroll-slider',
  'bs3-table',
  'ng4-storage',
  'ng2-button-loader',
  'edit-table',
  'ng2-tags',
  'ng2-preloader',
  'loading-info',
  'ng2-accordions',
  'bs3-breakpoint',


  'IonicCoffeescript',
  'angular2-example-http-login',
  'http-socket-proxy-router',
  'example-isomorphic-rest',
  'my-old-js-tests',
  'rebird-https-letsencrypt',
  'pdf-in-browser-angular-nodejs',


];

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
            proj = Project.From(dest);
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
        Helpers.error(err, true);
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
  for (let index = 0; index < GITHUB_PROJECTS_NAMES.length; index++) {
    const projectName = GITHUB_PROJECTS_NAMES[index];
    Helpers.log(`Checking project ${chalk.bold(projectName)}.`);
    const githubGitUrl = `${ADDRESS_GITHUB_SSH}${projectName}`;
    const dest = path.join(NPM_PROJCETS_LOCATION, projectName);
    const proj = Project.From(dest);
    if (proj.git.thereAreSomeUncommitedChange) {
      Helpers.run(`code .`, { cwd: dest }).async();
      Helpers.pressKeyAndContinue(`${chalk.bold(projectName)} - there are some uncommited changes.. please commit and press any key..`);
    }
    if (proj.git.currentBranchName !== 'master') {
      Helpers.run(`code .`, { cwd: dest }).async();
      Helpers.pressKeyAndContinue(`${chalk.bold(projectName)} - default branch is not master.. please commit and press any key..`);
    }
    proj.git.pushCurrentBranch();
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
    const proj = Project.From(dest);
    if (proj) {
      Helpers.info(proj.git.originURL);
    }

  }
  // git config --get remote.origin.url
  process.exit(0);
}

export default {
  $GITHUB_LIST_ORIGINS: CLIWRAP($GITHUB_LIST_ORIGINS, '$GITHUB_LIST_ORIGINS'),
  $GITHUB_DUMP: CLIWRAP($GITHUB_DUMP, '$GITHUB_DUMP'),
  $GITHUB_PUSH: CLIWRAP($GITHUB_PUSH, '$GITHUB_PUSH'),
  $GITHUB_PULL: CLIWRAP($GITHUB_PULL, '$GITHUB_PULL'),
}
