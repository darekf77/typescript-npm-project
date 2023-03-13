import { _ } from 'tnp-core';
import { fse } from 'tnp-core'
import chalk from 'chalk';
import { Project } from '../../project';
import { Helpers } from 'tnp-helpers';
import { path } from 'tnp-core'
import { config } from 'tnp-config';
import { PROGRESS_DATA } from 'tnp-models';
import { os } from 'tnp-core';

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

export async function $GIT_QUICK_COMMIT_AND_PUSH(args, exit = true) {
  if ((Project.Current as Project).git.isGitRepo) {
    global.tnpNonInteractive && PROGRESS_DATA.log({ msg: `Quick push start` })
    try {
      (Project.Current as Project).run(`git add --all . && git commit -m "update"`).sync();
      global.tnpNonInteractive && PROGRESS_DATA.log({ msg: `Adding and Commit Success` })
    } catch (e) {
      Helpers.warn(`Error adding/commiting git ${e}`, false);
    }
    await (Project.Current as Project).git.pushCurrentBranch();
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
    Helpers.run(`${config.frameworkName} ${Helpers.cliTool.simplifiedCmd($GIT_REMOVE_UNTRACKED.name)}`, { cwd: p.location }).sync()
  });
  process.exit(0);
}

export async function $PUSH(comitMessage: string, exit = true, force = false) {
  await (Project.Current as Project).gitActions.push(comitMessage, force);
  process.exit(0);
}

export async function $PUSH_ALL(comitMessage: string, exit = true, force = false) {
  await (Project.Current as Project).gitActions.pushAll(comitMessage, force);
  process.exit(0);
}


export async function $FORCE_PUSH(comitMessage: string, exit = true, force = false) {
  await (Project.Current as Project).gitActions.push(comitMessage, true);
  process.exit(0);
}

export async function $PULL(args: string, exit = true) {
  await (Project.Current as Project).gitActions.pull();
  process.exit(0);
}

export async function $CLEAR_PULL(args: string, exit = true) {
  await (Project.Current as Project).gitActions.pull(true);
  process.exit(0);
}


export async function $CLONE(args: string, exit = true) {
  const argsss = args.split(' ');
  const url = argsss.shift();
  const newName = argsss.shift()
  await (Project.Current as Project).git.clone(url, newName);
  process.exit(0);
}

export async function $RECOMMIT(args: string, exit = true) {
  const p = Project.Current;
  const lastMsg = p.run(`git log -1 --pretty=%B`, { output: false, cwd: p.location }).sync().toString().trim();
  p.run(`git reset --soft HEAD~1 && git add --all . && git commit -m "${lastMsg}"`).sync();
  Helpers.info(`Recomit done..msg:
        ${Helpers.terminalLine()}
        ${lastMsg}
        ${Helpers.terminalLine()}
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

function $GIT_INFO() {
  Helpers.info(`
  Global settings:

  username: ${Helpers.commnadOutputAsString('git config --global user.name')}
  email: ${Helpers.commnadOutputAsString('git config --global user.email')}

  Local settings:

  username: ${Helpers.commnadOutputAsString('git config user.name')}
  email: ${Helpers.commnadOutputAsString('git config user.email')}

  `);
  process.exit(0);
}

function $GIT_LAST_TAG_HASH() {
  Helpers.info(Project.Current.git.lastTagHash());
  process.exit(0);
}

function $PUSH_TAG(args: string) {
  const proj = Project.Current as Project;
  proj.bumpVersionForPathRelease(proj);
  proj.createNewVersionWithTagFor.pathRelease(args);
  proj.git.pushCurrentBranch();
  process.exit(0);
}


function $GIT_CHECK_TAG_EXISTS(args) {
  Helpers.info(`tag "${args}":
     exits = ${Helpers.git.checkTagExists(args)}
     `);
  process.exit(0)
}

function $LAST_TAG() {
  const proj = Project.Current as Project;
  Helpers.info(`

  last tag: ${proj.git.lastTagVersionName}
  last tag hash: ${proj.git.lastTagHash()}

  `);
  process.exit(0)
}

export default {
  $PUSH_TAG: Helpers.CLIWRAP($PUSH_TAG, '$PUSH_TAG'),
  $GIT_CHECK_TAG_EXISTS: Helpers.CLIWRAP($GIT_CHECK_TAG_EXISTS, '$GIT_CHECK_TAG_EXISTS'),
  $GIT_LAST_TAG_HASH: Helpers.CLIWRAP($GIT_LAST_TAG_HASH, '$GIT_LAST_TAG_HASH'),
  $LAST_TAG: Helpers.CLIWRAP($LAST_TAG, '$LAST_TAG'),
  $GIT_INFO: Helpers.CLIWRAP($GIT_INFO, '$GIT_INFO'),
  $GIT_QUICK_COMMIT_AND_PUSH: Helpers.CLIWRAP($GIT_QUICK_COMMIT_AND_PUSH, '$GIT_QUICK_COMMIT_AND_PUSH'),
  $GIT_QUICK_RESET_HARD_AND_PULL: Helpers.CLIWRAP($GIT_QUICK_RESET_HARD_AND_PULL, '$GIT_QUICK_RESET_HARD_AND_PULL'),
  $GIT_REMOVE_UNTRACKED: Helpers.CLIWRAP($GIT_REMOVE_UNTRACKED, '$GIT_REMOVE_UNTRACKED'),
  $GIT_REMOVE_UNTRACKED_EVERYWHERE: Helpers.CLIWRAP($GIT_REMOVE_UNTRACKED_EVERYWHERE, '$GIT_REMOVE_UNTRACKED_EVERYWHERE'),
  $RENAME_ORIGIN: Helpers.CLIWRAP($RENAME_ORIGIN, '$RENAME_ORIGIN'),
  $SET_ORIGIN: Helpers.CLIWRAP($SET_ORIGIN, '$SET_ORIGIN'),
  $PUSH: Helpers.CLIWRAP($PUSH, '$PUSH'),
  $PUSH_ALL: Helpers.CLIWRAP($PUSH_ALL, '$PUSH_ALL'),
  $FORCE_PUSH: Helpers.CLIWRAP($FORCE_PUSH, '$FORCE_PUSH'),
  $REPUSH: Helpers.CLIWRAP($REPUSH, '$REPUSH'),
  $PULL: Helpers.CLIWRAP($PULL, '$PULL'),
  $CLEAR_PULL: Helpers.CLIWRAP($CLEAR_PULL, '$CLEAR_PULL'),
  $DIFF: Helpers.CLIWRAP($DIFF, '$DIFF'),
  $RECOMMIT: Helpers.CLIWRAP($RECOMMIT, '$RECOMMIT'),
  $CLONE: Helpers.CLIWRAP($CLONE, '$CLONE'),
}
