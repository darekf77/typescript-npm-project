import * as _ from 'lodash';
import { run, clearConsole } from "../process";
import { Project, ProjectIsomorphicLib, ProjectFrom, BaseProjectLib } from '../project';
import { clear } from "./CLEAR";
import { BuildOptions, BuildDir, LibType, EnvironmentName } from "../models";
import { info, error } from "../messages";
import * as path from 'path';

import chalk from "chalk";
import { nearestProjectTo, crossPlatofrmPath } from '../helpers';
import { config } from '../config';

export interface BuildArgs {
  copyto: string[] | string;
  environmentName: string;
  noConsoleClear: string;
  envName: string;
  onlyWatchNoBuild?: boolean;
  baseHref: string;
  '--base-href': string
}

function handleArguments(args: string, outDir: BuildDir, watch: boolean) {
  let noConsoleClear = false;
  if (process.platform === 'win32') {
    args = args.replace(/\\/g, '\\\\')
  }
  const argsObj: BuildArgs = require('minimist')(args.split(' '));

  argsObj.noConsoleClear

  if (argsObj.noConsoleClear) {
    noConsoleClear = true;
  }

  // let baseHref = argsObj.baseHref || argsObj['--base-href'] || ''
  if (!noConsoleClear) {
    clearConsole()
  }


  // console.log('argsObj', argsObj)
  // process.exit(0)
  let copyto: Project[] = []
  if (argsObj.copyto) {
    if (_.isString(argsObj.copyto)) {
      argsObj.copyto = [argsObj.copyto]
    }
    copyto = argsObj.copyto.map(argPath => {
      // console.log('argPath', argPath)
      if (process.platform === 'win32') {
        if (!argPath.match(/\\/g) && !argPath.match(/\//g)) {
          error(`On windows.. please wrap your "copyto" parameter with double-quote like this:\n
tnp build:${outDir}${watch ? ':watch' : ''} --copyto "<windows path here>"`)
          process.exit(1)
        }
      }
      // console.log('raw arg', args)
      argPath = crossPlatofrmPath(argPath);
      // console.log('path', argPath)
      const project = nearestProjectTo(argPath);
      if (!project) {
        error(`Path doesn't contain tnp type project: ${argPath}`)
      }
      const what = path.normalize(`${project.location}/node_module/${Project.Current.name}`)
      info(`After each build finish ${what} will be update.`)
      return project;
    });
  }
  let environmentName: EnvironmentName = 'local';
  if (argsObj.environmentName || argsObj.envName) {
    environmentName = (argsObj.environmentName ? argsObj.environmentName : argsObj.envName) as any;
  }


  let onlyWatchNoBuild = false;
  if (argsObj.onlyWatchNoBuild as any === 'true') {
    onlyWatchNoBuild = true;
  }

  return {
    copyto, environmentName, onlyWatchNoBuild  //, baseHref
  }
}


export function buildLib(prod = false, watch = false, outDir: BuildDir, args: string) {

  const { copyto, environmentName, onlyWatchNoBuild } = handleArguments(args, outDir, watch);

  const options: BuildOptions = {
    prod, watch, outDir, copyto, environmentName, onlyWatchNoBuild
  };
  build(options, config.allowedTypes.libs)
}


export function buildApp(prod = false, watch = false, outDir: BuildDir = 'dist', args: string) {

  const { environmentName, onlyWatchNoBuild } = handleArguments(args, outDir, watch);

  const options: BuildOptions = {
    prod, watch, outDir, appBuild: true, environmentName, onlyWatchNoBuild
  };
  build(options, config.allowedTypes.app);
}


function build(opt: BuildOptions, allowedLibs: LibType[]) {

  const { prod, watch, outDir, appBuild, copyto } = opt;


  const project: Project = Project.Current;

  if (allowedLibs.includes(project.type)) {
    if (project.isSite) {
      project.recreate.join.init()
    }
    project.build(opt);
    if (watch) {
      if (project.isSite) {
        project.recreate.join.watch()
      }
    } else {
      process.exit(0)
    }
  } else {
    if (appBuild) {
      error(`App build only for tnp ${chalk.bold(allowedLibs.join(','))} project types`)
    } else {
      error(`Library build only for tnp ${chalk.bold(allowedLibs.join(','))} project types`)
    }
  }
}

function buildWatch(args) {
  if (config.allowedTypes.libs.includes(Project.Current.type)) {
    buildLib(false, true, 'dist', args)
  }
  if (config.allowedTypes.app.includes(Project.Current.type)) {
    buildApp(false, true, 'dist', args)
  }
}


export default {

  $BUILD_DIST: [(args) => buildLib(false, false, 'dist', args), `Build dist version of project library.`],
  $BUILD_DIST_WATCH: (args) => buildLib(false, true, 'dist', args),
  $BUILD_DIST_PROD: (args) => buildLib(true, false, "dist", args),

  $BUILD_BUNDLE: (args) => buildLib(false, false, 'bundle', args),
  $BUILD_BUNDLE_WATCH: (args) => buildLib(false, true, 'bundle', args),
  $BUILD_BUNDLE_PROD: (args) => buildLib(true, false, 'bundle', args),

  $BUILD_APP_PROD: (args) => buildApp(true, false, 'dist', args),
  $BUILD_APP: (args) => buildApp(false, false, 'dist', args),

  $BUILD_APP_WATCH: (args) => buildApp(false, true, 'dist', args),
  $BUILD_APP_WATCH_PROD: (args) => buildApp(false, true, 'dist', args),

  $START_APP: () => Project.Current.start(),

  // aliases
  $BUILD: (args) => {
    if (config.allowedTypes.libs.includes(Project.Current.type)) {
      buildLib(false, false, 'dist', args)
    }
    if (config.allowedTypes.app.includes(Project.Current.type)) {
      buildApp(false, false, 'dist', args)
    }
  },

  $BUILD_PROD: (args) => {
    if (config.allowedTypes.libs.includes(Project.Current.type)) {
      buildLib(true, false, 'dist', args)
    }
    if (config.allowedTypes.app.includes(Project.Current.type)) {
      buildApp(true, false, 'dist', args)
    }
  },

  $BUILDWATCH: (args) => {
    buildWatch(args)
  },

  $BUILD_WATCH: (args) => {
    buildWatch(args)
  },



  $START: () => Project.Current.start(),

  'Documentation': `
Building purpose:
- library
- application`

}
