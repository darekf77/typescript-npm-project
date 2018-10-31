//#region @backend
import * as _ from 'lodash';
import * as path from 'path';
import { LibType, BuildDir } from '../models';

import { Project, ProjectFrom } from '../project';
import { clearConsole } from '../process';
import config from '../config';


function clearGenerated(project: Project, all, recrusive, outDir: string) {
  if (project.isWorkspace) {
    const genWorkspace = ProjectFrom(path.join(project.location, outDir, project.name))
    if (genWorkspace) {
      genWorkspace.clear(all, recrusive);
    }
  } else if (project.isWorkspaceChildProject) {
    const genWorkspaceChild = ProjectFrom(path.join(project.parent.location, outDir, project.parent.name, project.name))
    if (genWorkspaceChild) {
      genWorkspaceChild.clear(all, recrusive)
    }
  }

}

export function clear(args, all = false) {
  let { recrusive = false, generated = false } = require('minimist')(args.split(' '));
  // console.log('onlyWorkspace', onlyWorkspace)

  clearConsole()
  const project = Project.Current
  if (generated) {
    clearGenerated(project, all, recrusive, config.folder.dist)
    // clearGenerated(project, all, recrusive, config.folder.bundle)
  } else {
    project.clear(all, recrusive)
  }

  process.exit(0)
}

export default {
  $CLEAN: (args) => clear(args),
  $CLEAR: (args) => clear(args),
  $CLEAN_ALL: (args) => clear(args, true),
  $CLEAR_ALL: (args) => clear(args, true)
}
//#endregion
