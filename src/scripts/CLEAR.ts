//#region @backend
import * as _ from 'lodash';
import * as path from 'path';
import { LibType, BuildDir } from '../models';

import { Project, ProjectFrom } from '../project';
import { clearConsole } from '../process';
import config from '../config';
import { TnpDBModel } from '../tnp-db';


function clearGenerated(project: Project, all, recrusive, outDir: string) {
  console.log(`Cleaning generated workspace in for ${project.location}`)
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

export async function clear(args, all = false) {
  let { recrusive = false, r = false, generated = false, g = false } = require('minimist')(args.split(' '));

  recrusive = (recrusive || r);
  generated = (generated || g);
  const project = Project.Current
  await (await TnpDBModel.Instance()).init(project).at.BUILD;

  // console.log('r', r)
  // console.log('recrusive', recrusive)
  // console.log('g', g)
  // console.log('generated', generated)

  clearConsole()

  if (generated) {
    clearGenerated(project, all, recrusive, config.folder.dist)
    // clearGenerated(project, all, recrusive, config.folder.bundle)
  } else {
    project.clear(all, recrusive)
  }

  process.exit(0)
}

export default {
  $CLEAN: async (args) => { await clear(args) },
  $CLEAR: async (args) => { await clear(args) },
  $CLEAN_ALL: async (args) => { await clear(args, true) },
  $CLEAR_ALL: async (args) => { await clear(args, true) }
}
//#endregion
