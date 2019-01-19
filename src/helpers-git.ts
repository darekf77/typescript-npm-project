//#region @backend
import * as child from 'child_process';
import { info, error, warn } from './messages';
import { basename } from 'path';
import { questionYesNo, run } from './process';

export function lastCommitHash(directoryPath): string {
  try {
    const cwd = directoryPath;
    let hash = child.execSync(`git log -1 --format="%H"`, { cwd }).toString().trim()
    return hash;
  } catch (e) {
    console.log(e)
    error(`Cannot counts commits in branch in: ${directoryPath}`)
  }

}


export function lastCommitDate(directoryPath): Date {
  try {
    const cwd = directoryPath;
    let unixTimestamp = child.execSync(`git log -1 --pretty=format:%ct`, { cwd }).toString().trim()
    return new Date(Number(unixTimestamp) * 1000)
  } catch (e) {
    console.log(e)
    error(`Cannot counts commits in branch in: ${directoryPath}`)
  }

}


export function countCommits(directoryPath) {
  try {
    const cwd = directoryPath;
    let currentLocalBranch = child.execSync(`git branch | sed -n '/\* /s///p'`, { cwd }).toString().trim()
    let value = child.execSync(`git rev-list --count ${currentLocalBranch}`, { cwd }).toString().trim()
    return Number(value);
  } catch (e) {
    console.log(e)
    error(`Cannot counts commits in branch in: ${directoryPath}`)
  }

}

export function currentBranchName(cwd) {
  try {
    const branchName = child.execSync(`git branch | sed -n '/\* /s///p'`, { cwd }).toString().trim()
    return branchName;
  } catch (e) {
    error(e);
  }
}

export function commitWhatIs(customMessage = 'changes') {

  try {
    run(`git add --all . `).sync()
  } catch (error) {
    warn(`Failed to git add --all .`);
  }

  try {
    run(`git commit -m "${customMessage}"`).sync()
  } catch (error) {
    warn(`Failed to git commit -m "${customMessage}"`);
  }

}

export async function pullCurrentBranch(directoryPath, askToRetry = false) {
  info(`Pulling git changes in "${directoryPath}" `)
  try {
    const cwd = directoryPath;
    let currentLocalBranch = child.execSync(`git branch | sed -n '/\* /s///p'`, { cwd }).toString().trim()
    child.execSync(`git pull origin ${currentLocalBranch}`, { cwd });
    info(`Branch "${currentLocalBranch}" updated successfully in ${basename(directoryPath)}`)
  } catch (e) {
    // console.log(e)
    error(`Cannot update current branch in: ${directoryPath}`, askToRetry, true)
    if (askToRetry) {
      await questionYesNo(`Do you wanna try again ?`, async () => {
        await pullCurrentBranch(directoryPath, askToRetry)
      }, () => {
        process.exit(0)
      })
    }

  }

}

export function defaultRepoBranch(directoryPath) {
  try {
    const cwd = directoryPath;
    let defaultBranch = child.execSync(`git symbolic-ref refs/remotes/origin/HEAD | sed 's@^refs/remotes/origin/@@'`, { cwd }).toString().trim()
    return defaultBranch;
  } catch (e) {
    console.log(e)
    error(`Cannot find default branch for repo in : ${directoryPath}`)
  }
}

//#endregion
