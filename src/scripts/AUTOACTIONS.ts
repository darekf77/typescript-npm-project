import * as path from 'path';
import * as _ from 'lodash';

import { Project } from "../project";
import { error, info } from '../helpers';
import { config as globalConfig } from '../config';
import { AutoActions } from '../project/features/auto-actions';


export async function autobuild(project: Project, watch = false, exit = true) {

  const ab = new AutoActions(project);
  await ab.build(watch)
  if (exit) {
    process.exit(0)
  }
}

function autorelease(project: Project) {
  const ar = new AutoActions(project);
  ar.release()
  process.exit(0)
}

export default {
  $AUTOBUILD: async (args: string) => {
    await autobuild(Project.Current, !!args.split(' ').find(a => a == 'watch'))
  },
  $AUTOBUILD_WATCH: async () => {
    await autobuild(Project.Current, true)
  },
  $AUTOBUILDWATCH: async () => {
    // console.log('AUTOBUILD!')
    await autobuild(Project.Current, true)
  },
  $autorelease: () => {
    autorelease(Project.Current)
  }

};
//#endregion
