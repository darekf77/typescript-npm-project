import * as _ from 'lodash';
import * as fse from 'fs-extra';
import { Project } from '../project';
import * as  psList from 'ps-list';
import { Helpers } from '../helpers';
import { Models } from '../models';
import chalk from 'chalk';
import * as path from 'path';
import { config } from '../config';
import { PackagesRecognitionExtended } from '../project/features/packages-recognition-extended';


function $CONFIGS() {
  Helpers.log(Project.Current.env.configsFromJs.map(c => c.domain).join('\n'));
  process.exit(0)
}

function CHECK_ENV() {
  Helpers.checkEnvironment(config.required);
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

  let ps: Models.system.PsListInfo[] = await psList()

  let info = ps.find(p => p.pid == pid);
  if (!info) {
    Helpers.error(`No process found with pid: ${args}`, false, true)
  }
  console.log(info)
}

function $COMMAND(args) {
  const command = decodeURIComponent(args);
  // info(`Starting command: ${command}`)
  Helpers.run(decodeURIComponent(args)).sync()
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
    Helpers.createSymLink(target, link)
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
    console.log(Helpers.getMostRecentFilesNames(process.cwd()))

    process.exit(0)
  },
  RUN_PROCESS,
  PSINFO: async (a) => {
    await $PSINFO(a)
  },
  UPDATE_ISOMORPHIC() {
    PackagesRecognitionExtended.fromProject(Project.Current).start(true);
  },

  $isbundlemode(args) {
    console.log('IS BUNDLE MODE? ', Project.isBundleMode)
    process.exit(0)
  },
  $ASSETS: () => recreate(),
  VERSION: () => version(),
  PATH: () => {
    console.log(Project.Tnp.location);
    process.exit(0)
  },
  COPY_RESOURCES: () => {
    Project.Current.checkIfReadyForNpm();
    Project.Current.bundleResources();
    process.exit(0)
  },
  $CHECK_ENV: (args) => {
    Helpers.checkEnvironment()
    process.exit(0)
  },
  $CHECK_ENVIRONMENT: (args) => {
    Helpers.checkEnvironment()
    process.exit(0)
  },



  $CONFIGS,
  CHECK_ENV:[CHECK_ENV, `Sample docs`],
  ENV_CHECK() {
    CHECK_ENV()
  },



}
