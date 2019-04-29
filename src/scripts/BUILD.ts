//#region @backend
import * as _ from 'lodash';

import { Project } from '../project';
import { config } from '../config';
import { questionYesNo, run, SystemTerminal } from '../helpers';

async function buildWatch(args) {

  const isLegitLib = config.allowedTypes.libs.includes(Project.Current.type);
  const isLegitApp = config.allowedTypes.app.includes(Project.Current.type);

  if (isLegitLib && isLegitApp) {
    SystemTerminal.runInNewInstance(`stmux -M [ 'tnp build:dist:watch' .. 'tnp build:app:watch' ]`)
    return;
  }

  if (isLegitLib) {
    await Project.Current.buildProcess.startForLib(false, true, 'dist', args)
  }
  if (isLegitApp) {
    await Project.Current.buildProcess.startForApp(false, true, 'dist', args)
  }
}


export default {

  $STATIC_BUILD_DIST: [(args) => Project.Current.buildProcess.startForLib(false, false, 'dist', args),
    `Build dist version of project library.`],

  $BUILD_DIST: [(args) => Project.Current.buildProcess.startForLib(false, false, 'dist', args), `Build dist version of project library.`],
  $BUILD_DIST_WATCH: (args) => Project.Current.buildProcess.startForLib(false, true, 'dist', args),
  $BUILD_DIST_PROD: (args) => Project.Current.buildProcess.startForLib(true, false, "dist", args),

  $BUILD_BUNDLE: (args) => Project.Current.buildProcess.startForLib(false, false, 'bundle', args),
  $BUILD_BUNDLE_WATCH: (args) => Project.Current.buildProcess.startForLib(false, true, 'bundle', args),
  $BUILD_BUNDLE_PROD: (args) => Project.Current.buildProcess.startForLib(true, false, 'bundle', args),

  $BUILD_APP_PROD: (args) => Project.Current.buildProcess.startForApp(true, false, 'dist', args),
  $BUILD_APP: (args) => Project.Current.buildProcess.startForApp(false, false, 'dist', args),

  $BUILD_APP_WATCH: (args) => Project.Current.buildProcess.startForApp(false, true, 'dist', args),
  $BUILD_APP_WATCH_PROD: (args) => Project.Current.buildProcess.startForApp(false, true, 'dist', args),

  $START_APP: async (args) => {
    await Project.Current.start(args)
  },

  // aliases
  $BUILD: async (args) => {

    if (config.allowedTypes.libs.includes(Project.Current.type)) {
      await Project.Current.buildProcess.startForLib(false, false, 'dist', args)
    }
    if (config.allowedTypes.app.includes(Project.Current.type)) {
      await Project.Current.buildProcess.startForApp(false, false, 'dist', args)
    }
    process.exit(0)
  },

  $BUILD_PROD: async (args) => {
    if (config.allowedTypes.libs.includes(Project.Current.type)) {
      await Project.Current.buildProcess.startForLib(true, false, 'dist', args)
    }
    if (config.allowedTypes.app.includes(Project.Current.type)) {
      await Project.Current.buildProcess.startForApp(true, false, 'dist', args)
    }
    process.exit(0)
  },

  $BUILDWATCH: (args) => {
    buildWatch(args)
  },

  $BUILD_WATCH: (args) => {
    buildWatch(args)
  },

  $START: async (args) => {

    await Project.Current.start(args)
  },

  'Documentation': `
Building purpose:
- library
- application`

}

//#endregion
