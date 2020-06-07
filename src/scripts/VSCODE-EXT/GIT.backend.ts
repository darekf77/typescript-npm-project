import * as _ from 'lodash';
import * as fse from 'fs-extra';
import { Project } from '../../project';
import { Helpers } from 'tnp-helpers';
import * as path from 'path';
import { config } from '../../config';
import { PROGRESS_DATA } from 'tnp-models';
import * as os from 'os';

const ADDRESS_GITHUB_HTTPS = 'https://github.com/darekf77/';
const USE_HTTPS_INSTEAD_SSH = os.userInfo().username === 'dfilipiak';

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


export async function $PUSH(args: string, exit = true) {
  const project = (Project.Current as Project);
  fixRemote(project);
  project.run(`git add --all . && git commit -m "update" && git push origin ${project.git.currentBranchName}`).sync();
  process.exit(0);
}

export async function $PULL(args: string, exit = true) {
  const project = (Project.Current as Project);
  fixRemote(project);
  try {
    project.run(`git add --all . && git commit -m "update"`).sync();
  } catch (error) { }
  project.run(`git push origin ${project.git.currentBranchName}`).sync();
  process.exit(0);
}


export async function $RECOMMIT() {
  const p = Project.Current;
  const lastMsg = p.run(`git log -1 --pretty=%B`, { output: false, cwd: p.location }).sync().toString().trim();
  p.run(`git reset --soft HEAD~1 && git add --all . && git commit -m "${lastMsg}"`).sync();
  Helpers.info(`Recomit done.. msg:
${Helpers.terminalLine()}
  ${lastMsg}
${Helpers.terminalLine()}
  `);
  process.exit(0)
}

export default {
  $GIT_QUICK_COMMIT_AND_PUSH: Helpers.CLIWRAP($GIT_QUICK_COMMIT_AND_PUSH, '$GIT_QUICK_COMMIT_AND_PUSH'),
  $GIT_QUICK_RESET_HARD_AND_PULL: Helpers.CLIWRAP($GIT_QUICK_RESET_HARD_AND_PULL, '$GIT_QUICK_RESET_HARD_AND_PULL'),
  $GIT_REMOVE_UNTRACKED: Helpers.CLIWRAP($GIT_REMOVE_UNTRACKED, '$GIT_REMOVE_UNTRACKED'),
  $GIT_REMOVE_UNTRACKED_EVERYWHERE: Helpers.CLIWRAP($GIT_REMOVE_UNTRACKED_EVERYWHERE, '$GIT_REMOVE_UNTRACKED_EVERYWHERE'),
  $PUSH: Helpers.CLIWRAP($PUSH, '$PUSH'),
  $PULL: Helpers.CLIWRAP($PULL, '$PULL'),
  $RECOMMIT: Helpers.CLIWRAP($RECOMMIT, '$RECOMMIT'),
}
