//#region @backend
import * as _ from 'lodash';
import * as fse from 'fs-extra';
import { Project, LibProject } from "../project";
import { BaselineSiteJoin } from "../project/features/baseline-site-join";
import * as  psList from 'ps-list';
import { PsListInfo } from '../models/ps-info';
import { error, info, HelpersLinks, killProcess } from '../helpers';
import chalk from 'chalk';
import { getMostRecentFilesNames } from '../helpers';
import { Helpers as HelpersMorphi } from "morphi";
import { run } from "../helpers";
import * as fs from 'fs';
import * as path from 'path';
import config from '../config';
import { commitWhatIs } from '../helpers';
import { paramsFrom } from '../helpers';
import { PackagesRecognitionExtended } from '../project/features/packages-recognition-extended';
import { TnpDB } from '../tnp-db';
import { listProcesses } from './list-processes.backend';

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
  currentLib.copyManager.copyBuildedDistributionTo(destination);
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

function DEPS_SHOW(args: string) {
  Project.Current.packageJson.show('deps show')
  process.exit(0)
}

function DEPS_HIDE(args: string) {
  Project.Current.packageJson.hide('deps hide')
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

function NPM_FIXES() {
  console.log(Project.Current.node_modules.fixesForNodeModulesPackages)
  process.exit(0)
}

export async function develop(args: string, exit = true) {

  const { kill = false } = require('minimist')(!args ? [] : args.split(' '));
  const db = await TnpDB.Instance;

  const projectName = _.first(args.trim().split(' '));


  const projects = db.getProjects().filter(p => !p.project.isGenerated);
  let project = projects.find(p => {
    return p.project.genericName === projectName;
  });
  if (!project) {
    project = projects.find(p => {
      return p.project.name === projectName;
    });
  }
  if (!project) {
    error(`Cannot find project: "${projectName}"`, false, true)
  }
  const projectForAction = []
  const ins = project.project;
  projectForAction.push(ins);
  if (ins.children) {
    for (let index = 0; index < ins.children.length; index++) {
      const child = ins.children[index];
      projectForAction.push(child);
    }
  }
  if (kill) {


    let ps: PsListInfo[] = await psList();
    ps = ps
      .filter(proc => {

        return proc.cmd.startsWith('/Applications/Visual Studio Code.app/');
        // const incudesInCmd = projectForAction.map(p => p.location)
        //   .filter(p => proc.cmd.search(p) !== -1).length > 0;
        // return incudesInCmd;
      })
      .filter(p => {
        // return !!~p.cmd.search('--clientProcessId=')
        return !!~p.cmd.search('--renderer-client-id=')
      });
    console.log(ps.length)
    // ps.forEach(p => {
    //   console.log(p.cmd)
    //   const first = _.first(p.cmd.match(/\-\-renderer\-client\-id\=[0-9]+/));
    //   const num = (first && first.split('=').length === 2) ? first.split('=')[1] : void 0;
    //   if (_.isNumber(num)) {
    //     console.log(`Probobly pid: ${num}`)
    //   } else {
    //     console.log(`NOT pid: ${num}`)
    //   }
    // })
    // for (let index = 0; index < ps.length; index++) {
    //   const pppp = ps[index];
    //   const procesesss = await listProcesses(pppp.pid, false);
    //   console.log(`For ${pppp.pid} children:
    //   ${procesesss.children && procesesss.children.length}
    //   ${procesesss.cmd}
    //   `);
    // }
  } else {
    for (let index = 0; index < projectForAction.length; index++) {
      const projectToOpen = projectForAction[index];
      run(`code ${projectToOpen.location}`).sync();
    }
  }
}


export default {
  develop,
  npmFixes: NPM_FIXES,

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

  $DEPS_CORE() {
    Project.Current.packageJson.coreRecreate()
    process.exit(0)
  },

  $DEDUPE(args: string) {
    Project.Current.packageJson.dedupe(args.trim() === '' ? void 0 : args.split(' '))
    process.exit(0)
  },

  $DEPS_DEDUPE(args: string) {
    Project.Current.packageJson.dedupe()
    process.exit(0)
  },

  DEPS_SHOW,
  $DEPS_RECREATE(args: string) {
    DEPS_SHOW(args)
  },

  DEPS_SHOW_IF_STANDALONE(args: string) {
    if (Project.Current.isStandaloneProject) {
      info(`Showing deps for standalone project`)
      Project.Current.packageJson.show('is standalone show')
    }
    commitWhatIs(`show package.json dependencies`)
    process.exit(0)
  },

  DEPS_HIDE,
  $DEPS_CLEAN(args: string) {
    DEPS_HIDE(args)
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
