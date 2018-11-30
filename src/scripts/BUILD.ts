//#region @backend
import * as _ from 'lodash';
import chalk from "chalk";

// local
import { Project, ProjectFrom } from '../project';
import { BuildOptions, BuildDir, LibType } from "../models";
import { error, info } from "../messages";
import { config } from '../config';
import { handleArguments } from './BUILD-handle-arguments.fn';
import { init } from './INIT';
import { resolveProjectIfGenerated } from './BUILD-static';
import { questionYesNo, run } from '../process';
import { SystemTerminal } from '../system-terminal';



export async function buildLib(prod = false, watch = false, outDir: BuildDir, args: string) {

  const { copyto, onlyWatchNoBuild, forClient, genOnlyClientCode, compileOnce } = handleArguments(args, outDir, watch);

  const options: BuildOptions = {
    prod, watch, outDir, forClient, copyto, onlyWatchNoBuild, args, genOnlyClientCode, compileOnce
  };
  await build(options, config.allowedTypes.libs)
}


export async function buildApp(prod = false, watch = false, outDir: BuildDir = 'dist', args: string) {

  const { onlyWatchNoBuild } = handleArguments(args, outDir, watch);

  const options: BuildOptions = {
    prod, watch, outDir, appBuild: true, onlyWatchNoBuild, args
  };
  await build(options, config.allowedTypes.app);
}



export async function build(buildOptions: BuildOptions, allowedLibs: LibType[], project: Project = Project.Current, exit = true) {

  const { watch, appBuild, args } = buildOptions;

  if (_.isArray(allowedLibs) && !allowedLibs.includes(project.type)) {
    if (appBuild) {
      error(`App build only for tnp ${chalk.bold(allowedLibs.join(','))} project types`)
    } else {
      error(`Library build only for tnp ${chalk.bold(allowedLibs.join(','))} project types`)
    }
  }

  await project.checker.check(buildOptions);

  if (watch) {
    await init(args).watch.project(project)
  } else {
    await init(args).project(project);
  }

  project = await resolveProjectIfGenerated(project, buildOptions, args)



  await project.build(buildOptions);
  if (exit && !watch) {
    process.exit(0)
  }

}



async function buildWatch(args) {

  const isLegitLib = config.allowedTypes.libs.includes(Project.Current.type);
  const isLegitApp = config.allowedTypes.app.includes(Project.Current.type);

  if (isLegitLib && isLegitApp) {
    SystemTerminal.runInNewInstance(`stmux -M [ 'tnp build:dist:watch' .. 'tnp build:app:watch' ]`)
    return
  }

  if (isLegitLib) {
    await buildLib(false, true, 'dist', args)
  }
  if (isLegitApp) {
    await buildApp(false, true, 'dist', args)
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

  $START_APP: async (args) => {
    await Project.Current.start(args)
  },

  // aliases
  $BUILD: async (args) => {

    if (config.allowedTypes.libs.includes(Project.Current.type)) {
      await buildLib(false, false, 'dist', args)
    }
    if (config.allowedTypes.app.includes(Project.Current.type)) {
      await buildApp(false, false, 'dist', args)
    }
    process.exit(0)
  },

  $BUILD_PROD: async (args) => {
    if (config.allowedTypes.libs.includes(Project.Current.type)) {
      await buildLib(true, false, 'dist', args)
    }
    if (config.allowedTypes.app.includes(Project.Current.type)) {
      await buildApp(true, false, 'dist', args)
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
