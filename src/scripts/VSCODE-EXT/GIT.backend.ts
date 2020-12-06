import * as _ from 'lodash';
import * as fse from 'fs-extra';
import chalk from 'chalk';
import { Project } from '../../project';
import { Helpers } from 'tnp-helpers';
import * as path from 'path';
import { config } from 'tnp-config';
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

export async function $PUSH(comitMessage: string, exit = true, force = false) {
  await (Project.Current as Project).gitActions.push(comitMessage, force);
  process.exit(0);
}

export async function $PULL(args: string, exit = true) {
  await (Project.Current as Project).gitActions.pull();
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

export async function $SET_ORIGIN(newOriginNameOrUrl: string) {
  const proj = Project.Current;
  if (proj && proj.git.isGitRepo) {
    proj.run(`git remote rm origin`).sync();
    proj.run(`git remote add origin ${newOriginNameOrUrl}`).sync();
    Helpers.info(`Done`);
  } else {
    Helpers.error(`This folder is not a git repo... `, false, true);
  }

  process.exit(0)
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
  $SET_ORIGIN: Helpers.CLIWRAP($SET_ORIGIN, '$SET_ORIGIN'),
  $PUSH: Helpers.CLIWRAP($PUSH, '$PUSH'),
  $REPUSH: Helpers.CLIWRAP($REPUSH, '$REPUSH'),
  $PULL: Helpers.CLIWRAP($PULL, '$PULL'),
  $DIFF: Helpers.CLIWRAP($DIFF, '$DIFF'),
  $RECOMMIT: Helpers.CLIWRAP($RECOMMIT, '$RECOMMIT'),
}
