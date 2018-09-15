//#region @backend
import * as child from 'child_process';
import { info, error } from './messages';
import { basename } from 'path';

export function pullCurrentBranch(directoryPath) {
  info(`Pulling git changes in "${directoryPath}" `)
  try {
    const cwd = directoryPath;
    let currentLocalBranch = child.execSync(`git branch | sed -n '/\* /s///p'`, { cwd }).toString().trim()
    child.execSync(`git pull origin ${currentLocalBranch}`, { cwd });
    info(`Branch "${currentLocalBranch}" updated successfully in ${basename(directoryPath)}`)
  } catch (e) {
    console.log(e)
    error(`Cannot update current branch in: ${directoryPath}`)
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
