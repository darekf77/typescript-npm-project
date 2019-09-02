//#region @backend
import * as _ from 'lodash';
import * as fse from 'fs-extra';
import { Project } from "../project";
import * as  psList from 'ps-list';
import { Helpers } from '../helpers';
import { Models } from '../models';
import chalk from 'chalk';
import * as path from 'path';
import { config } from '../config';
import { PackagesRecognitionExtended } from '../project/features/packages-recognition-extended';

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
    Helpers.info(`Copy DONE`)
  } else {
    Helpers.error(`Bad argument for ${chalk.bold('copy to module')} : "${args}"`)
  }
  process.exit(0)
}


function copy(destLocaiton) {

  const currentLib = Project.Current;
  const destination = Project.From(destLocaiton);
  if (!destination) {
    Helpers.error(`Incorect project in: ${destLocaiton}`)
  }
  currentLib.copyManager.copyBuildedDistributionTo(destination, void 0, false);
  Helpers.info(`Project "${chalk.bold(currentLib.name)}" successfully installed in "${destination.name}"`);
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
  $OPEN_WORKSPACE() {
    const workspacePath = path.join(Project.Current.location, Project.Current.nameOfCodeWorkspace);
    if (!fse.existsSync(workspacePath)) {
      Project.Current.recreateCodeWorkspace();
    }
    Project.Current.run(`code ${Project.Current.nameOfCodeWorkspace} &`).sync();
    process.exit(0)
  },
  $OPEN_CORE_PROJECT() {
    Project.Current.run(`code ${Project.by(Project.Current.type).location} &`).sync();
    process.exit(0)
  },
  $OPEN_TNP_PROJECT() {
    Project.Tnp.run(`code ${Project.Tnp.location} &`).sync();
    process.exit(0)
  },
  $OPEN_BASELINE() {
    if (Project.Current.isSite) {
      if (Project.Current.isWorkspace) {
        Project.Current.baseline.run(`code ${Project.Current.baseline.nameOfCodeWorkspace} &`).sync();
      } else {
        Project.Current.baseline.run(`code . &`).sync();
      }
      process.exit(0)
    }
    Helpers.error(`This is not "site project"`, false, true);
  },
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
