//#region imports
import { _, crossPlatformPath } from 'tnp-core';
import * as express from 'express';
import { path } from 'tnp-core';
import { TnpDB } from 'tnp-db';
import { Project } from '../../project';
import type { ProjectDocker } from '../../project';
import { config } from 'tnp-config';
import { Helpers } from 'tnp-helpers';
import { Models } from 'tnp-models';
import { BuildOptions } from 'tnp-db';
//#endregion

//#region BUILD


const BUILD_DIST = async (args) => {
  let proj = Helpers.cliTool.resolveChildProject(args, Project.Current) as Project;
  if (proj.isSmartContainerChild) {
    proj = proj.parent;
  }
  await proj.buildProcess.startForLib(BuildOptions.fromJson({
    outDir: 'dist'
  }));
};


const BUILD_DIST_WATCH = async (args) => {
  return (Project.Current as Project)
    .buildProcess
    .startForLib(BuildOptions.fromJson({
      outDir: 'dist',
      watch: true,
    }));
}

const DEV = async (args) => {
  return (Project.Current as Project)
    .buildProcess
    .startForLib(BuildOptions.fromJson({
      outDir: 'dist',
      watch: true,
      skipCopyToSelection: true,
    }));
}



const $BUILD_WATCH = async (args) => {
  let proj = Helpers.cliTool.resolveChildProject(args, Project.Current) as Project;
  if (proj.isSmartContainerChild) {
    Helpers.error('[firedev] not supported build watch for smart container child')
  } else {
    await proj.buildProcess.startForLib(BuildOptions.fromJson({
      outDir: 'dist',
      skipCopyToSelection: true,
      copytoAll: true,
      watch: true,
    }));
  }
};


//#region BUILD / ALIASES
const BUILD_APP_WATCH = (args) => (Project.Current as Project).buildProcess.startForApp(BuildOptions.fromJson({
  outDir: 'dist',
  appBuild: true,
  watch: true,
})); // @LAST


const BUILD_DIST_ALL = async (args) => {
  // console.log('AM FUCKING HEre',(Project.Current as Project).isGenerated)
  // process.exit(0)
  args += ' --buildForAllClients';
  await (Project.Current as Project).buildProcess.startForLibFromArgs(false, false, 'dist', args);
};

const BUILD_BUNDLE = (args) => (Project.Current as Project).buildProcess.startForLibFromArgs(false, false, 'bundle', args);
const BUILD_BUNDLE_PROD = (args) => (Project.Current as Project).buildProcess.startForLibFromArgs(true, false, 'bundle', args);

async function BUILD_LIB(args) {
  await BUILD_DIST(args);
}

async function BD(args) {
  await BUILD_DIST(args);
}

async function BL(args) {
  await BUILD_DIST(args);
}

async function BB(args) {
  await BUILD_BUNDLE(args);
}

const $BUILD_DIST_PROD = (args) => (Project.Current as Project).buildProcess.startForLibFromArgs(true, false, 'dist', args);
const $BUILD_BUNDLE_WATCH = (args) => (Project.Current as Project).buildProcess.startForLibFromArgs(false, true, 'bundle', args);
const $BUILD_BUNDLE_PROD = (args) => (Project.Current as Project).buildProcess.startForLibFromArgs(true, false, 'bundle', args);
const $BUILD_BUNDLE_PROD_WATCH = (args) => (Project.Current as Project).buildProcess.startForLibFromArgs(true, true, 'bundle', args);
const $BUILD_APP_PROD = (args) => (Project.Current as Project).buildProcess.startForAppFromArgs(true, false, 'dist', args);

const $BUILD_APP = (args) => (Project.Current as Project).buildProcess.startForAppFromArgs(false, false, 'dist', args);
const $BUILD_DIST_APP = (args) => (Project.Current as Project).buildProcess.startForAppFromArgs(false, false, 'dist', args);
const $BUILD_BUNDLE_APP = (args) => (Project.Current as Project).buildProcess.startForAppFromArgs(false, false, 'bundle', args);

const $BUILD_APP_WATCH_PROD = (args) => (Project.Current as Project).buildProcess.startForAppFromArgs(false, true, 'dist', args);
const $START_APP = async (args) => {
  await (Project.Current as Project).start(args);
};

const $BUILD_PROD = async (args) => {
  if ((Project.Current as Project).typeIs(...config.allowedTypes.libs)) {
    await (Project.Current as Project).buildProcess.startForLibFromArgs(true, false, 'dist', args);
  }
  if ((Project.Current as Project).typeIs(...config.allowedTypes.app)) {
    await (Project.Current as Project).buildProcess.startForAppFromArgs(true, false, 'dist', args);
  }
  process.exit(0);
};
const BUILD_LIB_WATCH = async (args) => BUILD_DIST_WATCH(args);
const BDW = (args) => BUILD_DIST_WATCH(args);
const BLW = (args) => BUILD_DIST_WATCH(args);
const $BAW = (args) => BUILD_APP_WATCH(args);
//#endregion

//#endregion

//#endregion

//#region OTHER
const $RECREATE = () => {
  const proj = Project.Current;
  if (proj.isContainer) {
    const childs = (proj.children as Project[])
      .filter(c => c.frameworkVersionAtLeast('v2') && !c.isTnp);
    for (let index = 0; index < childs.length; index++) {
      const c = childs[index];
      c.git.restoreLastVersion(config.file.package_json);
    }
    Project.projects = [];
    for (let index = 0; index < childs.length; index++) {
      let c = childs[index];
      childs[index] = Project.From(c.location);
      c = childs[index];
      Helpers.info(`Saving package for ${c.location}`);
      c.packageJson.save(`rereating container`);
    }
  }
  process.exit(0);
};

const $BACKUP = async (args) => {
  const proj = Helpers.cliTool.resolveChildProject(args, Project.Current) as ProjectDocker;
  await proj.saveToFile();

  process.exit(0);
};

const $INSTALL_LOCALLY = async (args) => {
  const argsObj: Models.dev.ReleaseOptions = require('minimist')(args.split(' '));
  argsObj.args = args;
  const proj = Helpers.cliTool.resolveChildProject(args, Project.Current) as Project;
  if (proj.isVscodeExtension) {
    await proj.vscodext.installLocaly(argsObj);
  }
  process.exit(0);
};

const $STOP = async (args) => {
  const proj = Helpers.cliTool.resolveChildProject(args, Project.Current);
  if (proj) {
    (proj as ProjectDocker).stop();
  }
  process.exit(0);
};



async function $DB_BUILDS_UPDATE() {
  const db = await TnpDB.Instance();
  await db.updateProcesses();
  process.exit(0);
}

//#endregion

export default {
  //#region export default
  DEV: Helpers.CLIWRAP(DEV, 'DEV'),
  $RECREATE: Helpers.CLIWRAP($RECREATE, '$RECREATE'),
  $BUILD: Helpers.CLIWRAP($BUILD, '$BUILD'),
  $CLEAN_BUILD: Helpers.CLIWRAP($CLEAN_BUILD, '$CLEAN_BUILD'),
  $BUILD_WATCH: Helpers.CLIWRAP($BUILD_WATCH, '$BUILD_WATCH'),
  $DEFAULT_BUILD: Helpers.CLIWRAP($DEFAULT_BUILD, '$DEFAULT_BUILD'),
  $DB_BUILDS_UPDATE: Helpers.CLIWRAP($DB_BUILDS_UPDATE, '$DB_BUILDS_UPDATE'),
  BUILD_DIST: Helpers.CLIWRAP(BUILD_DIST, 'BUILD_DIST'),
  BUILD_DIST_ALL: Helpers.CLIWRAP(BUILD_DIST_ALL, 'BUILD_DIST_ALL'),
  BUILD_LIB: Helpers.CLIWRAP(BUILD_LIB, 'BUILD_LIB'),
  BD: Helpers.CLIWRAP(BD, 'BD'),
  BL: Helpers.CLIWRAP(BL, 'BL'),
  BUILD_BUNDLE_PROD: Helpers.CLIWRAP(BUILD_BUNDLE_PROD, 'BUILD_BUNDLE_PROD'),
  BUILD_BUNDLE: Helpers.CLIWRAP(BUILD_BUNDLE, 'BUILD_BUNDLE'),
  BB: Helpers.CLIWRAP(BB, 'BB'),
  BUILD_DIST_WATCH: Helpers.CLIWRAP(BUILD_DIST_WATCH, 'BUILD_DIST_WATCH'),
  BUILD_DIST_WATCH_ALL: Helpers.CLIWRAP(BUILD_DIST_WATCH_ALL, 'BUILD_DIST_WATCH_ALL'),
  BDW: Helpers.CLIWRAP(BDW, 'BDW'),
  BUILD_LIB_WATCH: Helpers.CLIWRAP(BUILD_LIB_WATCH, 'BUILD_LIB_WATCH'),
  BLW: Helpers.CLIWRAP(BLW, 'BLW'),
  BUILD_APP_WATCH: Helpers.CLIWRAP(BUILD_APP_WATCH, 'BUILD_APP_WATCH'),
  $BAW: Helpers.CLIWRAP($BAW, '$BAW'),
  $BUILD_DIST_PROD: Helpers.CLIWRAP($BUILD_DIST_PROD, '$BUILD_DIST_PROD'),
  $BUILD_BUNDLE_WATCH: Helpers.CLIWRAP($BUILD_BUNDLE_WATCH, '$BUILD_BUNDLE_WATCH'),
  $BUILD_BUNDLE_PROD: Helpers.CLIWRAP($BUILD_BUNDLE_PROD, '$BUILD_BUNDLE_PROD'),
  $BUILD_BUNDLE_PROD_WATCH: Helpers.CLIWRAP($BUILD_BUNDLE_PROD_WATCH, '$BUILD_BUNDLE_PROD_WATCH'),
  $BUILD_APP_PROD: Helpers.CLIWRAP($BUILD_APP_PROD, '$BUILD_APP_PROD'),
  $BUILD_APP: Helpers.CLIWRAP($BUILD_APP, '$BUILD_APP'),
  $BUILD_DIST_APP: Helpers.CLIWRAP($BUILD_DIST_APP, '$BUILD_DIST_APP'),
  $BUILD_BUNDLE_APP: Helpers.CLIWRAP($BUILD_BUNDLE_APP, '$BUILD_BUNDLE_APP'),

  $BUILD_APP_WATCH_PROD: Helpers.CLIWRAP($BUILD_APP_WATCH_PROD, '$BUILD_APP_WATCH_PROD'),
  $START_APP: Helpers.CLIWRAP($START_APP, '$START_APP'),
  $BUILD_PROD: Helpers.CLIWRAP($BUILD_PROD, '$BUILD_PROD'),
  $STOP: Helpers.CLIWRAP($STOP, '$STOP'),
  $INSTALL_LOCALLY: Helpers.CLIWRAP($INSTALL_LOCALLY, '$INSTALL_LOCALLY'),
  $BACKUP: Helpers.CLIWRAP($BACKUP, '$BACKUP'),
  //#endregion
};
