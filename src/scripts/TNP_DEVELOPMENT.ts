//#region @backend
import * as _ from 'lodash';
import * as fse from 'fs-extra';
import { Project, LibProject } from "../project";
import { BaselineSiteJoin } from "../project/features/baseline-site-join";
import * as  psList from 'ps-list';
import { PsListInfo } from '../models/ps-info';
import { error, info, HelpersLinks, killProcess, warn } from '../helpers';
import chalk from 'chalk';
import { getMostRecentFilesNames } from '../helpers';
import { Helpers as HelpersMorphi } from "morphi";
import { run } from "../helpers";
import * as glob from 'glob';
import * as fs from 'fs';
import * as path from 'path';
import config from '../config';
import { commitWhatIs } from '../helpers';
import { paramsFrom } from '../helpers';
import { PackagesRecognitionExtended } from '../project/features/packages-recognition-extended';
import { TnpDB } from '../tnp-db';

async function copyModuleto(args: string) {
  let [packageName, project]: [string, (Project | string)] = args.split(' ') as any;
  if (_.isString(packageName) && packageName.trim() !== '' && _.isString(project) && project.trim() !== '') {
    if (packageName.startsWith(`${config.folder.node_modules}/`)) {
      packageName = packageName.replace(`${config.folder.node_modules}/`, '')
    }
    if (!path.isAbsolute(project)) {
      project = Project.From(path.join(process.cwd(), project)) as Project;
    } else {
      project = Project.From(project) as Project;
    }

    await project.node_modules.copy(packageName).to(project);
    info(`Copy DONE`)
  } else {
    error(`Bad argument for ${chalk.bold('copy to module')} : "${args}"`)
  }
  process.exit(0)
}


function copy(destLocaiton) {

  const currentLib = (Project.Current as LibProject);
  const destination = Project.From(destLocaiton);
  if (!destination) {
    error(`Incorect project in: ${destLocaiton}`)
  }
  currentLib.copyManager.copyBuildedDistributionTo(destination, void 0, false);
  info(`Project "${chalk.bold(currentLib.name)}" successfully installed in "${destination.name}"`);
}

function copyto(args: string) {

  const destLocaitons = args.split(' ').filter(a => a.trim() !== '');

  destLocaitons.forEach(c => copy(c));


  process.exit(0)
}


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



function NPM_FIXES() {
  console.log(Project.Current.node_modules.fixesForNodeModulesPackages)
  process.exit(0)
}


export default {

  NPM_FIXES,

  LN(args: string) {
    let [target, link] = args.split(' ');
    HelpersLinks.createSymLink(target, link)
    process.exit(0)
  },

  // $COPY_FROM(args: string) {
  //   const [from, to, pkgName] = args.trim().split(' ');
  //   Project.From(from).node_modules.copy(pkgName).to(Project.From(to))
  //   process.exit()
  // },

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
  $MOD: async () => {
    if (Project.Current.isSite) {
      await Project.Current.join.init();
    }
    await Project.Current.sourceModifier.init(`Source modfier`)
    process.exit(0)
  },
  UPDATE_ISOMORPHIC() {
    PackagesRecognitionExtended.fromProject(Project.Current).start(true);
  },
  $MOD_WATCH: () => {
    Project.Current.sourceModifier.initAndWatch();
    // process.exit(0)
  },
  $isbundlemode(args) {
    console.log('IS BUNDLE MODE? ', Project.isBundleMode)
    process.exit(0)
  },
  $ASSETS: () => recreate(),
  // $FILES_CUSTOM: (args) => {
  //   console.log(new BaselineSiteJoin(Project.Current).files.allCustomFiles)
  //   process.exit(0)
  // },
  // $FILES_BASELINE: (args) => {
  //   console.log(new BaselineSiteJoin(Project.Current).files.allBaselineFiles)
  //   process.exit(0)
  // },

  JOIN: async () => {
    await Project.Current.join.init()
    process.exit(0)
  },

  VERSION: () => version(),
  PATH: () => {
    console.log(Project.Tnp.location);
    process.exit(0)
  },
  COPY_RESOURCES: () => {
    Project.Current.checkIfReadyForNpm();
    (Project.Current as LibProject).bundleResources()

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

  $copytoproject: (args) => {
    copyto(args)
  },
  $copy_to_project: (args) => {
    copyto(args)
  },
  $copyto: (args) => {
    copyto(args)
  },
  $copymoduletoproject: async (args) => {
    await copyModuleto(args)
  },
  $copy_module_to_project: async (args) => {
    await copyModuleto(args)
  }


}

//#endregion
