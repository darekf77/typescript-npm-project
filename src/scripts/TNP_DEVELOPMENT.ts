//#region @backend
import { Project, BaseProjectLib, ProjectFrom } from "../project";
import { BaselineSiteJoin } from "../project/baseline-site-join";
import { WatchNoRace } from "../watcher-no-race";
import * as  psList from 'ps-list';
import { PsListInfo } from '../models/ps-info';
import { error } from '../messages';
import chalk from 'chalk';
import { getMostRecentFilesNames } from '../helpers';
import { Helpers as HelpersMorphi } from "morphi";
import { run } from "../process";
import * as fs from 'fs';
import * as path from 'path';
import config from '../config';
import { paramsFrom } from '../helpers';

function recreate() {
  Project.Current.recreate.assets()
  Project.Current.recreate.gitignore()
  process.exit(0)

}

function version() {
  console.log(Project.Tnp.version);
  process.exit(0)
}

async function RUN_PROCESS() {
  console.log(`RUNNING ON PID: ${chalk.bold(process.pid.toString())}`)
  console.log(`----------PPID: ${process.ppid}`)
  process.env['teststttt'] = '12';
  process.env['hello'] = 'world';
}


async function $PSINFO(args: string) {
  const pid = Number(args)

  let ps: PsListInfo[] = await psList()

  let info = ps.find(p => p.pid == pid);
  if (!info) {
    error(`No process found with pid: ${args}`, false, true)
  }
  console.log(info)
}

function $COMMAND(args) {
  const command = decodeURIComponent(args);
  // info(`Starting command: ${command}`)
  run(decodeURIComponent(args)).sync()
  // info(`Finish command: ${command}`)
  process.exit(0)
}


function $GIT_REMOVE_UNTRACKED() {
  const gitginoredfiles = Project.Current.recreate.filesIgnoredBy.gitignore
    .filter(f => !(f === config.folder.node_modules)) // link/unlink takes care of node_modules
  gitginoredfiles.forEach(f => {
    const p = path.join(Project.Current.location, f);
    if (fs.existsSync(p)) {
      try {
        if (fs.statSync(p).isDirectory()) {
          Project.Current.run(`git rm -rf ${f}`).sync()
        } else {
          Project.Current.run(`git rm ${f}`).sync()
        }
      } catch (error) {
        console.log(error)
      }

    }
  });
  process.exit(0)
}



export default {
  $COPY_FROM(args: string) {
    const [from, to, pkgName] = args.trim().split(' ');
    ProjectFrom(from).node_modules.copy(pkgName).to(ProjectFrom(to))
    process.exit()
  },
  $GIT_REMOVE_UNTRACKED,
  $GIT_REMOVE_UNTRACKED_EVERYWHERE: () => {
    Project.projects.forEach(p => {
      run(`tnp ${paramsFrom($GIT_REMOVE_UNTRACKED.name)}`, { cwd: p.location }).sync()
    })
    process.exit(0)
  },
  $COMMAND,
  CIRCURAL_CHECK() {
    Project.Current.run(`madge --circular --extensions ts ./src`).sync()
    process.exit(0)
  },
  $FILEINFO: (args) => {
    console.log(getMostRecentFilesNames(process.cwd()))

    process.exit(0)
  },
  RUN_PROCESS,
  PSINFO: async (a) => {
    await $PSINFO(a)
  },
  $MOD: () => {
    Project.Current.sourceModifier.init()
    process.exit(0)
  },
  $MOD_WATCH: () => {
    Project.Current.sourceModifier.initAndWatch();
    // process.exit(0)
  },
  $isbundlemode(args) {
    console.log('IS BUNDLE MODE? ', Project.Current.isBundleMode)
    process.exit(0)
  },
  $ASSETS: () => recreate(),
  $FILES_CUSTOM: (args) => {
    console.log(new BaselineSiteJoin(Project.Current).files.allCustomFiles)
    process.exit(0)
  },
  $FILES_BASELINE: (args) => {
    console.log(new BaselineSiteJoin(Project.Current).files.allBaselineFiles)
    process.exit(0)
  },
  $WATCHERS_SHOW: async (args) => {
    await WatchNoRace.Instance.showProceses()
  },
  VERSION: () => version(),
  PATH: () => {
    console.log(Project.Tnp.location);
    process.exit(0)
  },
  COPY_RESOURCES: () => {
    Project.Current.checkIfReadyForNpm();
    (Project.Current as BaseProjectLib).bundleResources()

    process.exit(0)
  },
  $CHECK_ENV: (args) => {
    HelpersMorphi.checkEnvironment()
    process.exit(0)
  },
  $CHECK_ENVIRONMENT: (args) => {
    HelpersMorphi.checkEnvironment()
    process.exit(0)
  },
}

//#endregion
