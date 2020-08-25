import * as _ from 'lodash';
import * as fse from 'fs-extra';
import chalk from 'chalk';
import { Project } from '../../project';
import { Helpers } from 'tnp-helpers';
import * as path from 'path';
import { config } from '../../config';
import { PROGRESS_DATA } from 'tnp-models';
import * as os from 'os';

export type TAction = 'clone' | 'pull';
const USE_HTTPS_INSTEAD_SSH = !os.hostname().endsWith('.local'); // TODO

function $GIT_REMOVE_UNTRACKED() {
  const gitginoredfiles = (Project.Current as Project).recreate.filesIgnoredBy.gitignore
    .filter(f => !(f === config.folder.node_modules)) // link/unlink takes care of node_modules
  gitginoredfiles.forEach(f => {
    const p = path.join((Project.Current as Project).location, f);
    if (fse.existsSync(p)) {
      try {
        if (fse.statSync(p).isDirectory()) {
          (Project.Current as Project).run(`git rm -rf ${f}`).sync()
        } else {
          (Project.Current as Project).run(`git rm ${f}`).sync()
        }
      } catch (error) {
        console.log(error)
      }

    }
  });
  process.exit(0)
}

export function $GIT_QUICK_COMMIT_AND_PUSH(args, exit = true) {
  if ((Project.Current as Project).git.isGitRepo) {
    global.tnpNonInteractive && PROGRESS_DATA.log({ msg: `Quick push start` })
    try {
      (Project.Current as Project).run(`git add --all . && git commit -m "update"`).sync();
      global.tnpNonInteractive && PROGRESS_DATA.log({ msg: `Adding and Commit Success` })
    } catch (e) {
      Helpers.warn(`Error adding/commiting git ${e}`, false);
    }
    (Project.Current as Project).git.pushCurrentBranch();
    global.tnpNonInteractive && PROGRESS_DATA.log({ msg: `Pushing to repository success` })
  } else {
    Helpers.warn(`This is not a git repo: ${process.cwd()}`, false)
  }
  exit && process.exit(0);
}

export function $GIT_QUICK_RESET_HARD_AND_PULL(args, exit = true) {
  if ((Project.Current as Project).git.isGitRepo) {
    try {
      (Project.Current as Project).run(`git reset --hard`).sync();
    } catch (error) { }
    (Project.Current as Project).git.pullCurrentBranch();
  } else {
    Helpers.error(`Not able to pull and reset hard: ${process.cwd()}`);
  }
  exit && process.exit(0);
}

const $GIT_REMOVE_UNTRACKED_EVERYWHERE = () => {
  Project.projects.forEach(p => {
    Helpers.run(`tnp ${Helpers.cliTool.paramsFrom($GIT_REMOVE_UNTRACKED.name)}`, { cwd: p.location }).sync()
  });
  process.exit(0);
}

function fixRemote(project: Project) {
  const originUrl = project.git.originURL;
  if (originUrl.startsWith('git@github') && USE_HTTPS_INSTEAD_SSH) {
    project.run(`git remote set-url origin ${originUrl.replace('git@github.com:', 'https://github.com/')}`).sync();
  }
}


async function PUSH_ORIGIN(container: Project, projects: Project[], comitMessage: string, exit = true) {

  const ADDRESS_GITHUB_SSH = container.run(`git config --get remote.origin.url`,
    { output: false }).sync().toString();
  global.hideLog = false;
  for (let index = 0; index < projects.length; index++) {
    const project = projects[index];
    const projectName = project.name;
    Helpers.log(`Checking project ${chalk.bold(projectName)}.`);

    const dest = path.join(container.location, projectName);
    let proj = Project.From<Project>(dest);
    const projBylocation = Project
      .From<Project>(path.join(container.location, path.basename(project.location)));
    if (!proj && projBylocation) {
      Helpers.warn(`Please use same na name as project basename and in package.json name`);
    }
    if (!proj && !!projBylocation) {
      try {
        const cloneCommand = `git clone` +
          ` ${ADDRESS_GITHUB_SSH.replace(`${container.name}.git`, `${project.name}.git`)}`
        container.run(cloneCommand)
          .sync()
      } catch (error) {
        Helpers.error(`Please use same na for:
     1. Project folder
     2. Porject name property in package.json
     3. Project <name>.git in git remote url


Fix this in location: ${path.join(container.location, path.basename(project.location))}
        `, false, true)
      }
    }
    proj = Project.From<Project>(dest);

    if (!proj) {
      Helpers.error(`Not able to find project ${chalk.bold(projectName)} `, false, true)
    }

    if (proj.git.currentBranchName !== 'master') {
      Helpers.run(`code .`, { cwd: dest }).async();
      Helpers.pressKeyAndContinue(`${chalk.bold(projectName)} - default branch is not master..please commit and press any key..`);
    }

    let commitSuccess = false;
    if (_.isString(comitMessage) && comitMessage.length > 1) {
      if (proj.git.thereAreSomeUncommitedChange) {
        Helpers.info(`Comminting changes automaticly with message: "${chalk.bold(comitMessage)}"`)
        try {
          proj.run(`git add --all .`).sync();
        } catch (error) { }
        try {
          proj.run(`git commit -m "${comitMessage}"`).sync();
          commitSuccess = true;
        } catch (error) { }
      }
    }

    if (!commitSuccess && proj.git.thereAreSomeUncommitedChange) {
      Helpers.run(`code .`, { cwd: dest }).async();
      Helpers.pressKeyAndContinue(`${chalk.bold(projectName)} - there are some uncommited changes..please commit and press any key..`);
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



export async function $PUSH(comitMessage: string, exit = true, force = false) {
  const project = (Project.Current as Project);
  if (project.isContainer && project.packageJson.linkedProjects.length > 0) {
    await PUSH_ORIGIN(
      project,
      project.children.filter(c => {
        const ok = project.packageJson.linkedProjects.includes(c.name);
        // if (ok) {
        //   Helpers.warn(`OK FOR ${ c.name }`)
        // } else {
        //   Helpers.warn(`NOT OK FOR ${ c.name }`)
        // }
        return ok;
      }),
      comitMessage
    )
  }

  fixRemote(project);
  try {
    project.run(`git add --all . && git commit -m "update"`).sync();
  } catch (error) { }
  if (force) {
    const branch = project.git.currentBranchName;
    Helpers.info(`FORCE UPDATE OF BRANCH: ${branch}`);
    project.run(`git push -f origin ${branch}`).sync();
  } else {
    project.git.pushCurrentBranch();
  }
  if (exit) {
    process.exit(0);
  }
}

export async function $PULL(args: string, exit = true) {
  const project = (Project.Current as Project);
  fixRemote(project);
  if (project.isContainer && project.packageJson.linkedProjects.length > 0) {
    const container = project;
    global.hideLog = false;
    const ADDRESS_GITHUB_SSH = container.run(`git config --get remote.origin.url`,
      { output: false }).sync().toString();
    const projects = project.packageJson.linkedProjects;

    for (let index = 0; index < projects.length; index++) {
      const projectName = projects[index];
      const githubGitUrl = `${ADDRESS_GITHUB_SSH}${projectName}`;
      let action: TAction = 'clone';
      const dest = path.join(container.location, projectName);

      const process = async (retry = false) => {
        Helpers.info(`${retry ? '' : '\n\n'} -- - ${
          retry ? 'Retrying' : 'Starting'
          } pull of ${chalk.underline(projectName)} --- ${retry ? '' : '\n\n'}`)
        action = fse.existsSync(dest) ? 'pull' : 'clone';
        try {
          const dest = path.join(container.location, projectName);
          if (action === 'pull') {
            let proj: Project;
            while (!proj) {
              proj = Project.From<Project>(dest);
              if (!proj) {
                Helpers.run(`code ${dest}`).async();
                Helpers.pressKeyAndContinue(`Fix metadata / package.json of project ${
                  chalk.bold(projectName)
                  } to continue and press any key`)
              }
            }
            if (proj.git.thereAreSomeUncommitedChange) {
              Helpers.run(`code ${dest} `).async();
              Helpers.pressKeyAndContinue(`Prepare project ${chalk.bold(projectName)} to pull` +
                `from git press any key to try again`)
            }
            proj.git.pullCurrentBranch();
            Helpers.info(`Pull new origin for ${projectName}`);
          } else {
            Helpers.run(`git clone ${githubGitUrl} `, { cwd: container.location }).sync();
            Helpers.info(`Cloned origin for ${projectName}`);
          }
        } catch (err) {
          // Helpers.error(err, true);
          Helpers.run(`code ${dest} `).async();
          const tryAgain = await Helpers.questionYesNo(`Try again dump project ${projectName} ?`);
          if (tryAgain) {
            await process(true);
          } else {
            Helpers.info(`Skipping project ${chalk.underline(projectName)} `);
          }
        }
      }
      await process();
    }
    process.exit(0)
  }

  try {
    project.run(`git add --all. && git commit -m "update"`).sync();
  } catch (error) { }
  project.git.pushCurrentBranch();
  process.exit(0);
}


export async function $RECOMMIT(args: string, exit = true) {
  const p = Project.Current;
  const lastMsg = p.run(`git log -1 --pretty=%B`, { output: false, cwd: p.location }).sync().toString().trim();
  p.run(`git reset --soft HEAD~1 && git add --all . && git commit -m "${lastMsg}"`).sync();
  Helpers.info(`Recomit done..msg:
        ${ Helpers.terminalLine()}
        ${ lastMsg}
        ${ Helpers.terminalLine()}
        `);
  if (exit) {
    process.exit(0);
  }
}


export async function $REPUSH(args) {
  await $RECOMMIT(args, false);
  await $PUSH(args, true, true);
}

export async function $RENAME_ORIGIN(newOriginNameOrUrl: string) {
  const proj = Project.Current;
  if (proj && proj.git.isGitRepo) {
    proj.git.renameOrigin(newOriginNameOrUrl);
  } else {
    Helpers.error(`This folder is not a git repo... `, false, true);
  }
  process.exit(0)
}

export async function $DIFF(newOriginNameOrUrl: string) {
  const proj = Project.Current as Project;

  function cmd(p: Project) {

    const out = p.run(`git diff --name-only`, { output: false }).sync().toString();
    if (out.trim() !== '' && out.trim().split('\n').length > 0) {
      Helpers.info(`${chalk.bold(p.genericName)}`);
      console.log(`${out.trim().split('\n').map(l => `${[p.location]}/${l}`).join('\n')}`);
    } else {
      Helpers.info(`${chalk.bold(p.genericName)} - nothing has changed...`);
    }
  }

  if (proj) {
    if (proj.isContainer) {
      if (proj.git.isGitRepo) {
        cmd(proj);
      }
      (proj.children as Project[]).forEach(c => {
        cmd(c);
      })
    } else if (proj.git.isGitRepo) {
      cmd(proj);
    }

  } else {
    Helpers.error(`This folder is not a git repo... `, false, true);
  }
  process.exit(0)
}



export default {
  $GIT_QUICK_COMMIT_AND_PUSH: Helpers.CLIWRAP($GIT_QUICK_COMMIT_AND_PUSH, '$GIT_QUICK_COMMIT_AND_PUSH'),
  $GIT_QUICK_RESET_HARD_AND_PULL: Helpers.CLIWRAP($GIT_QUICK_RESET_HARD_AND_PULL, '$GIT_QUICK_RESET_HARD_AND_PULL'),
  $GIT_REMOVE_UNTRACKED: Helpers.CLIWRAP($GIT_REMOVE_UNTRACKED, '$GIT_REMOVE_UNTRACKED'),
  $GIT_REMOVE_UNTRACKED_EVERYWHERE: Helpers.CLIWRAP($GIT_REMOVE_UNTRACKED_EVERYWHERE, '$GIT_REMOVE_UNTRACKED_EVERYWHERE'),
  $RENAME_ORIGIN: Helpers.CLIWRAP($RENAME_ORIGIN, '$RENAME_ORIGIN'),
  $PUSH: Helpers.CLIWRAP($PUSH, '$PUSH'),
  $REPUSH: Helpers.CLIWRAP($REPUSH, '$REPUSH'),
  $PULL: Helpers.CLIWRAP($PULL, '$PULL'),
  $DIFF: Helpers.CLIWRAP($DIFF, '$DIFF'),
  $RECOMMIT: Helpers.CLIWRAP($RECOMMIT, '$RECOMMIT'),
}
