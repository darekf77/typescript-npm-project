//#region @backend
import * as lockfile from 'lockfile';
import * as fse from 'fs-extra';
import * as fs from 'fs';
import * as path from 'path';
import { Project } from './project/base-project';
import { config } from './config';
import { ProjectFrom } from './index';

const projectsFilePath = path.join(Project.Tnp.location, 'bin/projects.json');


class ProjectInstance {
  location: string;
  pid: string;
  get project() {
    return ProjectFrom(this.location);
  }
}

function checkInstance(projecBuild: string, pid) {

  waitToUnlockFile()

  lockfile.lockSync(projectsFilePath)

  if (!fs.existsSync(projectsFilePath)) {
    fse.writeJSONSync(projectsFilePath, {

    }, {
        spaces: 2,
        encoding: 'utf8'
      });
  }


  lockfile.unlockSync(projectsFilePath)
}


function waitToUnlockFile() {
  if (!lockfile.checkSync(projectsFilePath)) {
    setTimeout(() => {
      waitToUnlockFile()
    })
    return;
  }
}
//#endregion
