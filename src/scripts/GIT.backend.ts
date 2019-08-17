import * as _ from 'lodash';
import { Project } from '../project';
import { run, error } from '../helpers';
import * as fs from 'fs';
import * as path from 'path';
import config from '../config';
import { paramsFrom } from '../helpers';
import { PROGRESS_DATA } from '../progress-output';

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

export function $GIT_QUICK_COMMIT_AND_PUSH(exit = true) {
  if (Project.Current.git.isGitRepo) {
    global.tnpNonInteractive && PROGRESS_DATA.log({ msg: `Quick push start` })
    try {
      Project.Current.run(`git add --all . && git commit -m "update"`).sync();
      global.tnpNonInteractive && PROGRESS_DATA.log({ msg: `Adding and Commit Success` })
    } catch (e) {
      error(`Error adding/commiting git ${e}`, false, true);
    }
    Project.Current.git.pushCurrentBranch();
    global.tnpNonInteractive && PROGRESS_DATA.log({ msg: `Pushing to repository success` })
  } else {
    error(`This is not a git repo: ${process.cwd()}`, false, true)
  }
  exit && process.exit(0);
}

export function $GIT_QUICK_RESET_HARD_AND_PULL(exit = true) {
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
