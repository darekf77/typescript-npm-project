//#region @backend
import * as _ from 'lodash';

import { Project } from '../project';
import { config } from '../config';
import { SystemTerminal } from '../helpers';

async function buildWatch(args) {

  const isLegitLib = config.allowedTypes.libs.includes(Project.Current.type);
  const isLegitApp = config.allowedTypes.app.includes(Project.Current.type);

  if (isLegitLib && isLegitApp) {
    SystemTerminal.runInNewInstance(`stmux -M [ 'tnp build:dist:watch' .. 'tnp build:app:watch' ]`);
    return;
  }

  if (isLegitLib) {
    await Project.Current.buildProcess.startForLibFromArgs(false, true, 'dist', args);
  }
  if (isLegitApp) {
    await Project.Current.buildProcess.startForAppFromArgs(false, true, 'dist', args);
  }
}
const BUILD_DIST_WATCH = (args) => Project.Current.buildProcess.startForLibFromArgs(false, true, 'dist', args);
const BUILD_APP_WATCH = (args) => Project.Current.buildProcess.startForAppFromArgs(false, true, 'dist', args);
const BUILD_DIST = async (args) => {
  await Project.Current.buildProcess.startForLibFromArgs(false, false, 'dist', args);
};
const BUILD_BUNDLE = (args) => Project.Current.buildProcess.startForLibFromArgs(false, false, 'bundle', args);

export default {

  STATIC_BUILD: [(args) => {
    Project.Current.StaticVersion.buildProcess.startForLib({ args, staticBuildAllowed: true });
  }, `Build dist version of project library.`],

  STATIC_BUILD_DIST: [(args) => {
    Project.Current.StaticVersion.buildProcess.startForLib({ args, staticBuildAllowed: true });
  }, `Build dist version of project library.`],

  STATIC_BUILD_PROD: [(args) => Project.Current.StaticVersion.buildProcess
    .startForLib({ prod: true, args, staticBuildAllowed: true }),
    `Build dist version of project library.`],

  STATIC_BUILD_DIST_PROD: [(args) => Project.Current.StaticVersion.buildProcess
    .startForLib({ prod: true, args, staticBuildAllowed: true }),
    `Build dist version of project library.`],

  STATIC_BUILD_APP: [(args) => Project.Current.StaticVersion.buildProcess
    .startForApp({ args, staticBuildAllowed: true }),
    `Build dist version of project application withou.`],

  STATIC_BUILD_APP_PROD: [(args) => Project.Current.StaticVersion.buildProcess
    .startForApp({ prod: true, args, staticBuildAllowed: true }),
    `Build dist version of project application.`],

  BUILD_DIST,
  async BD(args) {
    await BUILD_DIST(args);
  },
  async BB(args) {
    await BUILD_BUNDLE(args);
  },

  BUILD_DIST_WATCH,
  BDW: BUILD_DIST_WATCH,
  BUILD_APP_WATCH,
  BAW: BUILD_APP_WATCH,

  $BUILD_DIST_PROD: (args) => Project.Current.buildProcess.startForLibFromArgs(true, false, 'dist', args),


  $BUILD_BUNDLE_WATCH: (args) => Project.Current.buildProcess.startForLibFromArgs(false, true, 'bundle', args),
  $BUILD_BUNDLE_PROD: (args) => Project.Current.buildProcess.startForLibFromArgs(true, false, 'bundle', args),

  $BUILD_APP_PROD: (args) => Project.Current.buildProcess.startForAppFromArgs(true, false, 'dist', args),
  $BUILD_APP: (args) => Project.Current.buildProcess.startForAppFromArgs(false, false, 'dist', args),

  $BUILD_APP_WATCH_PROD: (args) => Project.Current.buildProcess.startForAppFromArgs(false, true, 'dist', args),

  $START_APP: async (args) => {
    await Project.Current.start(args);
  },

  // aliases
  $BUILD: async (args) => {

    if (config.allowedTypes.libs.includes(Project.Current.type)) {
      await Project.Current.buildProcess.startForLibFromArgs(false, false, 'dist', args);
    }
    if (config.allowedTypes.app.includes(Project.Current.type)) {
      await Project.Current.buildProcess.startForAppFromArgs(false, false, 'dist', args);
    }
    process.exit(0);
  },

  $BUILD_PROD: async (args) => {
    if (config.allowedTypes.libs.includes(Project.Current.type)) {
      await Project.Current.buildProcess.startForLibFromArgs(true, false, 'dist', args);
    }
    if (config.allowedTypes.app.includes(Project.Current.type)) {
      await Project.Current.buildProcess.startForAppFromArgs(true, false, 'dist', args);
    }
    process.exit(0);
  },

  $BUILDWATCH: (args) => {
    buildWatch(args);
  },

  $BUILD_WATCH: (args) => {
    buildWatch(args);
  },

  $START: async (args) => {

    await Project.Current.start(args);
  },

  'Documentation': `
Building purpose:
- library
- application`

};

//#endregion
