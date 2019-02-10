//#region @backend
import * as _ from 'lodash';
import chalk from "chalk";

// local
import { Project, ProjectFrom } from '../project';
import { BuildOptions, BuildDir, LibType } from "../models";
import { error, info } from "../messages";
import { config } from '../config';
import { init } from './INIT';
import { resolveProjectIfGenerated } from './BUILD-static';
import { questionYesNo, run } from '../process';
import { SystemTerminal } from '../system-terminal';
import { TnpDB } from '../tnp-db';



export async function buildLib(prod = false, watch = false, outDir: BuildDir, args: string, overrideOptions: BuildOptions = {} as any) {
  const project: Project = Project.Current;
  const options: BuildOptions = BuildOptions.from(args, project, { outDir, watch, prod, appBuild: false, args });
  await build(_.merge(options, overrideOptions), config.allowedTypes.libs, project)
}


export async function buildApp(prod = false, watch = false, outDir: BuildDir = 'dist', args: string, overrideOptions: BuildOptions = {} as any) {
  const project: Project = Project.Current;
  const options: BuildOptions = BuildOptions.from(args, project, { outDir, watch, prod, appBuild: true, args });
  await build(_.merge(options, overrideOptions), config.allowedTypes.app, project);
}



export async function build(buildOptions: BuildOptions, allowedLibs: LibType[], project: Project, exit = true) {

  const { watch, appBuild, args } = buildOptions;

  if (_.isArray(allowedLibs) && !allowedLibs.includes(project.type)) {
    if (appBuild) {
      error(`App build only for tnp ${chalk.bold(allowedLibs.join(','))} project types`)
    } else {
      error(`Library build only for tnp ${chalk.bold(allowedLibs.join(','))} project types`)
    }
  }

  const transactions = (await (await TnpDB.Instance).transaction);
  await transactions.updateBuildsWithCurrent(project, buildOptions, process.pid, true)

  if (watch) {
    await init(args).watch.project(project)
  } else {
    await init(args).project(project);
  }

  project = await resolveProjectIfGenerated(project, buildOptions, args)

  await transactions.updateBuildsWithCurrent(project, buildOptions, process.pid, false)


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
