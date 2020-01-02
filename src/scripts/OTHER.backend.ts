import * as _ from 'lodash';
import * as fse from 'fs-extra';
import { Project } from '../project';
import * as  psList from 'ps-list';
import { Helpers } from '../helpers';
import { Models } from 'tnp-models';
import chalk from 'chalk';
import * as path from 'path';
import { config } from '../config';
import { PackagesRecognitionExtended } from '../project/features/packages-recognition-extended';
import { CLIWRAP } from './cli-wrapper.backend';


function $CONFIGS() {
  Helpers.log(Project.Current.env.configsFromJs.map(c => c.domain).join('\n'));
  process.exit(0)
}

function CHECK_ENV() {
  Helpers.checkEnvironment(config.required);
  process.exit(0)
}


function recreate() {
  Project.Current.recreate.initAssets()
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

function LN(args: string) {
  let [target, link] = args.split(' ');
  Helpers.createSymLink(target, link)
  process.exit(0)
}

function CIRCURAL_CHECK() {
  Project.Current.run(`madge --circular --extensions ts ./src`).sync()
  process.exit(0)
}

const $FILEINFO = (args) => {
  console.log(Helpers.getMostRecentFilesNames(process.cwd()))

  process.exit(0)
}



const PSINFO = async (a) => {
  await $PSINFO(a)
}

function UPDATE_ISOMORPHIC() {
  PackagesRecognitionExtended.fromProject(Project.Current).start(true);
}

function $isbundlemode(args) {
  console.log('IS BUNDLE MODE? ', Project.isBundleMode)
  process.exit(0)
}

const $ASSETS = () => recreate();
const VERSION = () => version();
const PATH = () => {
  console.log(Project.Tnp.location);
  process.exit(0)
};

const COPY_RESOURCES = () => {
  Project.Current.checkIfReadyForNpm();
  Project.Current.bundleResources();
  process.exit(0)
}

const $CHECK_ENV = (args) => {
  Helpers.checkEnvironment()
  process.exit(0)
};

const $CHECK_ENVIRONMENT = (args) => {
  Helpers.checkEnvironment()
  process.exit(0)
};

function ENV_CHECK() {
  CHECK_ENV()
}

export default {

  NPM_FIXES: CLIWRAP(NPM_FIXES, 'NPM_FIXES'),
  LN: CLIWRAP(LN, 'LN'),
  // $COPY_FROM(args: string) {
  //   const [from, to, pkgName] = args.trim().split(' ');
  //   Project.From(from).node_modules.copy(pkgName).to(Project.From(to))
  //   process.exit()
  // },
  $COMMAND: CLIWRAP($COMMAND, '$COMMAND'),
  CIRCURAL_CHECK: CLIWRAP(CIRCURAL_CHECK, 'CIRCURAL_CHECK'),
  $FILEINFO: CLIWRAP($FILEINFO, '$FILEINFO'),
  RUN_PROCESS: CLIWRAP(RUN_PROCESS, 'RUN_PROCESS'),
  PSINFO: CLIWRAP(PSINFO, 'PSINFO'),
  UPDATE_ISOMORPHIC: CLIWRAP(UPDATE_ISOMORPHIC, 'UPDATE_ISOMORPHIC'),
  $isbundlemode: CLIWRAP($isbundlemode, '$isbundlemode'),
  $ASSETS: CLIWRAP($ASSETS, '$ASSETS'),
  VERSION: CLIWRAP(VERSION, 'VERSION'),
  PATH: CLIWRAP(PATH, 'PATH'),
  COPY_RESOURCES: CLIWRAP(COPY_RESOURCES, 'COPY_RESOURCES'),
  $CHECK_ENV: CLIWRAP($CHECK_ENV, '$CHECK_ENV'),
  $CHECK_ENVIRONMENT: CLIWRAP($CHECK_ENVIRONMENT, '$CHECK_ENVIRONMENT'),
  $CONFIGS: CLIWRAP($CONFIGS, '$CONFIGS'),
  CHECK_ENV: [CLIWRAP(CHECK_ENV, 'CHECK_ENV'), `Sample docs`],
  ENV_CHECK: CLIWRAP(ENV_CHECK, 'ENV_CHECK'),

}
