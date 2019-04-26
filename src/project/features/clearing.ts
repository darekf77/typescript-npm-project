//#region @backend
import * as path from 'path';

import { clearConsole, log } from '../../helpers';
import { Project } from '../abstract/project';
import { TnpDB } from '../../tnp-db/wrapper-db';
import config from '../../config';
import { FeatureForProject } from '../abstract';

export class Clearing extends FeatureForProject {

 private clearGenerated(project: Project, all, recrusive, outDir: string) {
  log(`Cleaning generated workspace in for ${project.location}`)
  if (project.isWorkspace) {
    const genWorkspace = Project.From(path.join(project.location, outDir, project.name))
    if (genWorkspace) {
      genWorkspace.clear(all, recrusive);
    }
  } else if (project.isWorkspaceChildProject) {
    const genWorkspaceChild = Project.From(path.join(project.parent.location, outDir, project.parent.name, project.name))
    if (genWorkspaceChild) {
      genWorkspaceChild.clear(all, recrusive)
    }
  }

}



 async  clear(args, all = false) {

  let { recrusive = false, r = false, generated = false, g = false } = require('minimist')(args.split(' '));

  recrusive = (recrusive || r || all);
  generated = (generated || g);
  let project = this.project;
  if (all && project.isWorkspaceChildProject) {
    project = project.parent;
  }

  const db = await TnpDB.Instance;
  await (db).transaction.addProjectIfNotExist(project);
  db.transaction.setCommand('tnp clear')

  clearConsole()

  if (generated) {
    this.clearGenerated(project, all, recrusive, config.folder.dist)
    // clearGenerated(project, all, recrusive, config.folder.bundle)
  } else {
    project.clear(all, recrusive)
  }

  process.exit(0)
}
}

//#endregion
