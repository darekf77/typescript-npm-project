import * as _ from 'lodash';
import * as express from 'express';
import * as path from 'path';

import { Project } from '../../project';
import { config } from '../../config';
import { Helpers } from '../../helpers';
import { Models } from 'tnp-models';
import chalk from 'chalk';
import { CLIWRAP } from '../cli-wrapper.backend';

async function buildWatch(args) {

  const isLegitLib = config.allowedTypes.libs.includes(Project.Current.type);
  const isLegitApp = config.allowedTypes.app.includes(Project.Current.type);

  if (isLegitLib && isLegitApp) {
    Helpers.terminal.runInNewInstance(`stmux -M [ 'tnp build:dist:watch' .. 'tnp build:app:watch' ]`);
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
const BUILD_DIST_WATCH_ALL = async (args) => {
  args += ' --buildForAllClients';
  Project.Current.buildProcess.startForLibFromArgs(false, true, 'dist', args);
}
const BUILD_APP_WATCH = (args) => Project.Current.buildProcess.startForAppFromArgs(false, true, 'dist', args);
const BUILD_DIST = async (args) => {
  // console.log('AM FUCKING HEre',Project.Current.isGenerated)
  // process.exit(0)
  await Project.Current.buildProcess.startForLibFromArgs(false, false, 'dist', args);
};
const BUILD_DIST_ALL = async (args) => {
  // console.log('AM FUCKING HEre',Project.Current.isGenerated)
  // process.exit(0)
  args += ' --buildForAllClients';
  await Project.Current.buildProcess.startForLibFromArgs(false, false, 'dist', args);
};
const BUILD_BUNDLE = (args) => Project.Current.buildProcess.startForLibFromArgs(false, false, 'bundle', args);
const BUILD_BUNDLE_PROD = (args) => Project.Current.buildProcess.startForLibFromArgs(true, false, 'bundle', args);


const STATIC_BUILD = async (args) => {
  if (!Project.Current.isWorkspace) {
    Helpers.error(`Please use:
${chalk.gray(`$ ${config.frameworkName} static:build:lib`)}
or
${chalk.gray(`$ ${config.frameworkName} static:build:app`)}

inside workspace children.
    `, false, true)
  }
  (await Project.Current.StaticVersion()).buildProcess.startForLib({ args, staticBuildAllowed: true });
}

const STATIC_BUILD_LIB = async (args) => {
  (await Project.Current.StaticVersion()).buildProcess.startForLib({ args, staticBuildAllowed: true });
};

const STATIC_BUILD_PROD = async (args) => (await Project.Current.StaticVersion()).buildProcess
  .startForLib({ prod: true, args, staticBuildAllowed: true })

const STATIC_BUILD_LIB_PROD = async (args) => (await Project.Current.StaticVersion()).buildProcess
  .startForLib({ prod: true, args, staticBuildAllowed: true })

const STATIC_BUILD_APP = async (args) => (await Project.Current.StaticVersion()).buildProcess
  .startForApp({ args, staticBuildAllowed: true })

const STATIC_BUILD_APP_PROD = async (args) => (await Project.Current.StaticVersion()).buildProcess
  .startForApp({ prod: true, args, staticBuildAllowed: true })

const $SERVE = (args) => {
  let proj = Project.Current;
  if (!proj) {
    proj = Project.nearestTo(process.cwd());
  }
  if (proj && proj.isStandaloneProject) {
    if (!proj.env || !proj.env.config || !proj.env.config.build.options) {
      Helpers.error(`Please build your project first`, false, true);
    }
    const localUrl = `http://localhost:${8080}/${proj.name}/`;
    const app = express()
    const filesLocation = path.join(proj.location, config.folder.docs);
    const mainfestOverride = `/${proj.name}/${config.file.manifest_webmanifest}`;

    app.get(`/${proj.name}/*`, (req, res) => {
      // console.log(`path: "${req.path}"`)
      // console.log(`ORIG: "${req.originalUrl}"`)
      let filePath = req.originalUrl
        .replace(/\/$/, '')
        .replace(new RegExp(Helpers.escapeStringForRegEx(`/${proj.name}`)), '')
        .replace(new RegExp(Helpers.escapeStringForRegEx(`/${proj.name}`)), '') // QUICKFIX
        .replace(/^\//, '')
      // console.log(`path file: "${filePath}"`)
      // res.send(filePath)
      // res.end()
      if (filePath.includes('?')) {
        filePath = filePath.split('?')[0];
      }
      if (filePath === '') {
        filePath = 'index.html';
      }

      if (filePath === config.file.manifest_webmanifest) {
        const localMainfest = path.join(filesLocation, config.file.manifest_webmanifest);
        const file = JSON.parse(Helpers.readFile(localMainfest));
        file.start_url = localUrl;
        // console.log('mainfest override')
        res.json(file);
      } else {
        res.sendFile(filePath, { root: filesLocation });
      }
    })
    app.listen(8080, () => {
      console.log(`${config.frameworkName} standalone serve is runnning on: ${localUrl}`)
    });
  } else {
    const configServe: Models.dev.BuildServeArgsServe = require('minimist')(args.split(' '));
    if (!configServe.port && !configServe.baseUrl && !configServe.outDir) {
      Helpers.error(`Bad arguments for ${config.frameworkName} serve: ${configServe}`)
    }
    const app = express()
    app.use(configServe.baseUrl, express.static(path.join(process.cwd(), configServe.outDir)))
    app.listen(configServe.port, () => {
      console.log(`${config.frameworkName} serve is runnning on: http://localhost:${configServe.port}${configServe.baseUrl}`)
    });
  }

};


const $START = async (args) => {
  if (Project.Current.isStandaloneProject) {
    $SERVE(args);
    return;
  }
  if (!Project.Current.isWorkspace) {
    Helpers.error(`Please use this command only on workspace level`, false, true)
  }
  await Project.Current.start(args);
};

const SB = (args) => STATIC_BUILD(args);
const SBP = (args) => STATIC_BUILD_PROD(args);
const SBL = (args) => STATIC_BUILD_LIB(args);
const SBLP = (args) => STATIC_BUILD_LIB_PROD(args);
const SBA = (args) => STATIC_BUILD_APP(args);
const SBAP = (args) => STATIC_BUILD_APP_PROD(args);

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

const $BUILD_DIST_PROD = (args) => Project.Current.buildProcess.startForLibFromArgs(true, false, 'dist', args);
const $BUILD_BUNDLE_WATCH = (args) => Project.Current.buildProcess.startForLibFromArgs(false, true, 'bundle', args);
const $BUILD_BUNDLE_PROD = (args) => Project.Current.buildProcess.startForLibFromArgs(true, false, 'bundle', args);
const $BUILD_BUNDLE_PROD_WATCH = (args) => Project.Current.buildProcess.startForLibFromArgs(true, true, 'bundle', args);
const $BUILD_APP_PROD = (args) => Project.Current.buildProcess.startForAppFromArgs(true, false, 'dist', args);
const $BUILD_APP = (args) => Project.Current.buildProcess.startForAppFromArgs(false, false, 'dist', args);
const $BUILD_APP_WATCH_PROD = (args) => Project.Current.buildProcess.startForAppFromArgs(false, true, 'dist', args);
const $START_APP = async (args) => {
  await Project.Current.start(args);
};
// aliases
const $BUILD = async (args) => {

  if (config.allowedTypes.libs.includes(Project.Current.type)) {
    await Project.Current.buildProcess.startForLibFromArgs(false, false, 'dist', args);
  }
  if (config.allowedTypes.app.includes(Project.Current.type)) {
    await Project.Current.buildProcess.startForAppFromArgs(false, false, 'dist', args);
  }
  process.exit(0);
};
const $BUILD_PROD = async (args) => {
  if (config.allowedTypes.libs.includes(Project.Current.type)) {
    await Project.Current.buildProcess.startForLibFromArgs(true, false, 'dist', args);
  }
  if (config.allowedTypes.app.includes(Project.Current.type)) {
    await Project.Current.buildProcess.startForAppFromArgs(true, false, 'dist', args);
  }
  process.exit(0);
};
const $BUILDWATCH = (args) => {
  buildWatch(args);
};
const $BUILD_WATCH = (args) => {
  buildWatch(args);
};

const $STATIC_START = async (args) => $START(args);
const BUILD_LIB_WATCH = async (args) => BUILD_DIST_WATCH(args);

const $RELEASE = async (args) => {
  const argsObj: Models.dev.ReleaseOptions = require('minimist')(args.split(' '));
  argsObj.args = args;
  Project.Current.checkIfReadyForNpm();
  await Project.Current.release(argsObj)

  process.exit(0)
};

const $RELEASE_PROD = async (args) => {
  const argsObj: Models.dev.ReleaseOptions = require('minimist')(args.split(' '));
  argsObj.prod = true;
  argsObj.args = args;
  Project.Current.checkIfReadyForNpm();
  await Project.Current.release(argsObj)

  process.exit(0)
};
const BDW = (args) => BUILD_DIST_WATCH(args);
const BLW = (args) => BUILD_DIST_WATCH(args);
const $BAW = (args) => BUILD_APP_WATCH(args);

export default {
  STATIC_BUILD: CLIWRAP(STATIC_BUILD, 'STATIC_BUILD'),
  SB: CLIWRAP(SB, 'SB'),
  STATIC_BUILD_PROD: CLIWRAP(STATIC_BUILD_PROD, 'STATIC_BUILD_PROD'),
  SBP: CLIWRAP(STATIC_BUILD_PROD, 'STATIC_BUILD_PROD'),
  STATIC_BUILD_LIB: CLIWRAP(STATIC_BUILD_LIB, 'STATIC_BUILD_LIB'),
  SBL: CLIWRAP(SBL, 'SBL'),
  STATIC_BUILD_LIB_PROD: CLIWRAP(STATIC_BUILD_LIB_PROD, 'STATIC_BUILD_LIB_PROD'),
  SBLP: CLIWRAP(SBLP, 'SBLP'),
  STATIC_BUILD_APP: CLIWRAP(STATIC_BUILD_APP, 'STATIC_BUILD_APP'),
  SBA: CLIWRAP(SBA, 'SBA'),
  STATIC_BUILD_APP_PROD: CLIWRAP(STATIC_BUILD_APP_PROD, 'STATIC_BUILD_APP_PROD'),
  SBAP: CLIWRAP(SBAP, 'SBAP'),
  BUILD_DIST: CLIWRAP(BUILD_DIST, 'BUILD_DIST'),
  BUILD_DIST_ALL: CLIWRAP(BUILD_DIST_ALL, 'BUILD_DIST_ALL'),
  BUILD_LIB: CLIWRAP(BUILD_LIB, 'BUILD_LIB'),
  BD: CLIWRAP(BD, 'BD'),
  BL: CLIWRAP(BL, 'BL'),
  BUILD_BUNDLE_PROD: CLIWRAP(BUILD_BUNDLE_PROD, 'BUILD_BUNDLE_PROD'),
  BUILD_BUNDLE: CLIWRAP(BUILD_BUNDLE, 'BUILD_BUNDLE'),
  BB: CLIWRAP(BB, 'BB'),
  BUILD_DIST_WATCH: CLIWRAP(BUILD_DIST_WATCH, 'BUILD_DIST_WATCH'),
  BUILD_DIST_WATCH_ALL: CLIWRAP(BUILD_DIST_WATCH_ALL, 'BUILD_DIST_WATCH_ALL'),
  BDW: CLIWRAP(BDW, 'BDW'),
  BUILD_LIB_WATCH: CLIWRAP(BUILD_LIB_WATCH, 'BUILD_LIB_WATCH'),
  BLW: CLIWRAP(BLW, 'BLW'),
  BUILD_APP_WATCH: CLIWRAP(BUILD_APP_WATCH, 'BUILD_APP_WATCH'),
  $BAW: CLIWRAP($BAW, '$BAW'),
  $BUILD_DIST_PROD: CLIWRAP($BUILD_DIST_PROD, '$BUILD_DIST_PROD'),
  $BUILD_BUNDLE_WATCH: CLIWRAP($BUILD_BUNDLE_WATCH, '$BUILD_BUNDLE_WATCH'),
  $BUILD_BUNDLE_PROD: CLIWRAP($BUILD_BUNDLE_PROD, '$BUILD_BUNDLE_PROD'),
  $BUILD_BUNDLE_PROD_WATCH: CLIWRAP($BUILD_BUNDLE_PROD_WATCH, '$BUILD_BUNDLE_PROD_WATCH'),
  $BUILD_APP_PROD: CLIWRAP($BUILD_APP_PROD, '$BUILD_APP_PROD'),
  $BUILD_APP: CLIWRAP($BUILD_APP, '$BUILD_APP'),
  $BUILD_APP_WATCH_PROD: CLIWRAP($BUILD_APP_WATCH_PROD, '$BUILD_APP_WATCH_PROD'),
  $START_APP: CLIWRAP($START_APP, '$START_APP'),
  $BUILD: CLIWRAP($BUILD, '$BUILD'),
  $BUILD_PROD: CLIWRAP($BUILD_PROD, '$BUILD_PROD'),
  $BUILDWATCH: CLIWRAP($BUILDWATCH, '$BUILDWATCH'),
  $BUILD_WATCH: CLIWRAP($BUILD_WATCH, '$BUILD_WATCH'),
  $START: CLIWRAP($START, '$START'),
  $STATIC_START: CLIWRAP($STATIC_START, '$STATIC_START'),
  $SERVE: CLIWRAP($SERVE, '$SERVE'),
  $RELEASE: CLIWRAP($RELEASE, '$RELEASE'),
  $RELEASE_PROD: CLIWRAP($RELEASE_PROD, '$RELEASE_PROD'),
};
