import * as _ from 'lodash';
import * as fse from 'fs-extra';
import { Project, LibProject } from "../project";
import { BaselineSiteJoin } from "../project/features/baseline-site-join";
import * as  psList from 'ps-list';
import { PsListInfo } from '../models/ps-info';
import { error, info, HelpersLinks, killProcess, warn } from '../helpers';
import chalk from 'chalk';
import { getMostRecentFilesNames } from '../helpers';
import { Helpers as HelpersMorphi } from "morphi";
import { run } from "../helpers";
import * as glob from 'glob';
import * as fs from 'fs';
import * as path from 'path';
import config from '../config';
import { commitWhatIs } from '../helpers';
import { paramsFrom } from '../helpers';
import { PackagesRecognitionExtended } from '../project/features/packages-recognition-extended';
import { TnpDB } from '../tnp-db';

function $GIT_REMOVE_UNTRACKED() {
  const gitginoredfiles = Project.Current.recreate.filesIgnoredBy.gitignore
    .filter(f => !(f === config.folder.node_modules)) // link/unlink takes care of node_modules
  gitginoredfiles.forEach(f => {
    const p = path.join(Project.Current.location, f);
    if (fs.existsSync(p)) {
      try {
        if (fs.statSync(p).isDirectory()) {
          Project.Current.run(`git rm -rf ${f}`).sync()
        } else {
          Project.Current.run(`git rm ${f}`).sync()
        }
      } catch (error) {
        console.log(error)
      }

    }
  });
  process.exit(0)
}

export function $GIT_QUICK_COMMIT_AND_PUSH(args: string, exit = true) {
  if (Project.Current.git.isGitRepo) {
    try {
      Project.Current.run(`git add --all . && git commit -m "update"`).sync();
    } catch (error) { }
    Project.Current.git.pushCurrentBranch();
  } else {
    throw `This is not a git repo: ${process.cwd()}`
  }
  exit && process.exit(0);
}

export function $GIT_QUICK_RESET_HARD_AND_PULL(args: string, exit = true) {
  if (Project.Current.git.isGitRepo) {
    try {
      Project.Current.run(`git reset --hard`).sync();
    } catch (error) { }
    Project.Current.git.pullCurrentBranch();
  } else {
    throw `This is not a git repo: ${process.cwd()}`
  }
  exit && process.exit(0);
}

export default {
  $GIT_QUICK_COMMIT_AND_PUSH,
  $GIT_QUICK_RESET_HARD_AND_PULL,
  $GIT_REMOVE_UNTRACKED,
  $GIT_REMOVE_UNTRACKED_EVERYWHERE: () => {
    Project.projects.forEach(p => {
      run(`tnp ${paramsFrom($GIT_REMOVE_UNTRACKED.name)}`, { cwd: p.location }).sync()
    });
    process.exit(0);
  },

}
