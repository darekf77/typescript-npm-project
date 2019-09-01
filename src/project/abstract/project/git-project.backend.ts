import * as fse from 'fs-extra';
import * as path from 'path';

import { Project } from './project';
import { Helpers } from '../../../helpers';

export abstract class ProjectGit {
  //#region @backend
  public get git(this: Project,) {
    const self = this;
    return {
      resetFiles(...relativePathes: string[]) {
        relativePathes.forEach(p => {
          try {
            self.run(`git checkout HEAD -- ${p}`, { cwd: self.location }).sync()
          } catch (err) {
            Helpers.error(`[project.git] Not able to reset files: ${p} inside project ${self.name}.`
              , true, true)
          }
        })
      },
      get isGitRepo() {
        try {
          var test = self.run('git rev-parse --is-inside-work-tree',
            {
              cwd: self.location,
              output: false
            }).sync();
        } catch (e) {
        }
        return !!test;
      },
      get isGitRoot() {
        return fse.existsSync(path.join(self.location, '.git'))
      },
      async updateOrigin(askToRetry = false) {
        await Helpers.git.pullCurrentBranch(self.location, askToRetry);
      },
      pushCurrentBranch() {
        self.run(`git push origin ${Helpers.git.currentBranchName(self.location)}`).sync()
      },
      pullCurrentBranch() {
        self.run(`git pull origin ${Helpers.git.currentBranchName(self.location)}`).sync()
      },
      resetHard() {
        self.run(`git reset --hard`).sync()
      },

      countComits() {
        return Helpers.git.countCommits(self.location);
      },

      lastCommitDate() {
        return Helpers.git.lastCommitDate(self.location)
      },

      lastCommitHash() {
        return Helpers.git.lastCommitHash(self.location)
      }
    }
  }
  //#endregion
}

// export interface ProjectGit extends Partial<Project> { }
