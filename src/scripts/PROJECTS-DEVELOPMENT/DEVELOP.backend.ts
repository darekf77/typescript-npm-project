import * as _ from 'lodash';
import * as fse from 'fs-extra';
import { Project } from '../../project';
import { Helpers } from 'tnp-helpers';
import * as path from 'path';
import { config } from 'tnp-config';
import { TnpDB } from 'tnp-db';
import * as chokidar from 'chokidar';
import { notify } from 'node-notifier';
import { CLASS } from 'typescript-class-helpers';
import chalk from 'chalk';



function killallnode() {
  Helpers.run(`fkill -f node`).sync()
  //   run(`killall -9 node`).sync();

}



export async function $NAME_TEST() {
  // CLASS.getConfig($NAME_TEST)[0].
  console.log(CLASS.getName($NAME_TEST))
}

export async function killAll() {
  const db = await TnpDB.Instance();
  let projectsToKill = [];
  let p = (Project.Current as Project);
  projectsToKill.push(p)
  let workspace = p.isWorkspaceChildProject ? p.parent : void 0;
  if (!!workspace) {
    projectsToKill = projectsToKill.concat(workspace.children)
  }
  await db.killInstancesFrom(projectsToKill)
  process.exit(0)
}

export async function killonport(args, noExit = false) {
  const port = parseInt(args.trim())
  await Helpers.killProcessByPort(port);
  if (!noExit) {
    process.exit(0)
  }
}



function killvscode(args: string, exit = true) {
  try {
    Helpers.run(`kill -9 $(pgrep Electron)`).sync();
    Helpers.info(`Killled`)
  } catch (error) {
    Helpers.warn(`kill not needed`)
  }
  if (exit) {
    process.exit(0)
  }
}

export async function $DEVELOP(args: string, exit = true) {
  // console.log('adasdas')
  const { kill = false } = require('minimist')(!args ? [] : args.split(' '));
  const db = await TnpDB.Instance();
  let projects = (await db.getProjects())
    .map(p => p.project as Project)
    .filter(p => !p.isGenerated && !p.isGeneratedForRelease);

  const igt = path.join((Project.Tnp as Project).location, '../..', 'igt');
  // console.log('igt', igt)
  const unknowNPm: Project[] = [];
  if (fse.existsSync(igt)) {
    projects = projects.concat(fse.readdirSync(igt)
      .map(f => {
        f = path.join(igt, f);
        const proj = Project.From<Project>(f)
        // console.log(`${f} proj name: ${proj && proj.name}`);
        if (proj) {
          unknowNPm.push(proj)
        }
        return proj;
      }));
  }

  unknowNPm.forEach(p => {
    const external = path.join(p.location, 'external');
    if (fse.existsSync(external)) {
      projects = projects.concat(fse.readdirSync(external)
        .map(f => {
          f = path.join(external, f);
          const proj = Project.From<Project>(f)
          // console.log(`external proj name: ${proj && proj.name}`);
          if (proj) {
            unknowNPm.push(proj)
          }
          return proj;
        }));
    }
  });

  const projectsToOpen = args.trim().split(' ');
  const projectForAction: Project[] = [];

  projectsToOpen.forEach(projectName => {
    try {
      var regex = new RegExp(projectName);
    } catch (err) {
      Helpers.error(`Invalid regular expresion: ${projectName}`, false, true)
    }

    // console.log(`source: "${regex.source}"`)
    const projs = projects.filter(p => {
      return p && (p.genericName === projectName || regex.test(p.name))
    });
    if (projs) {
      projs.forEach(c => projectForAction.push(c));
    } else {
      Helpers.error(`Cannot find project: "${projectName}"`, true, true)
    }

    // projects.forEach(p => {
    //   console.log(`Test: ${p && p.name} with ${regex.source} ${p && regex.test(p.name)}`)
    //   return p && regex.test(p.name);
    // });

  });

  Helpers.info(`

  TO OPEN:
  ${projectForAction.map(p => `${chalk.bold(p.name)} (${p.location})`).join('\n')}

  `)
  killvscode('', false);
  for (let index = 0; index < projectForAction.length; index++) {
    const projectToOpen = projectForAction[index];
    projectToOpen.openInVscode();
  }
  process.exit(0)
}


function vscodekill(args) {
  killvscode(args);
}

function close(args) {
  killvscode(args);
}

const $KILL_ON_PORT = async (args: string) => {
  await killonport(args);
}

const $KILLONPORT = async (args: string) => {
  await killonport(args);
}

const $KILLALL = () => {
  killAll()
}

const $KILLALLNODE = () => {
  killallnode()
}

const $KILLWORKER = async () => {
  const db = await TnpDB.Instance();
  await db.killWorker();
  Helpers.info(`Done killing worker`);
  process.exit(0)
}

const CHOKI = () => {
  const project = (Project.Current as Project);
  // console.log(`PRE ASYNC FOR ${this.project.genericName}`)
  chokidar.watch([config.folder.src, config.folder.components], {
    ignoreInitial: true,
    followSymlinks: false,
    ignorePermissionErrors: true,
    cwd: project.location
  }).on('unlinkDir', (relativeDir) => {

  })
}

async function NOT(args: string) {
  _.times(10, (n) => {
    notify({
      message: 'hey' + args + n.toString(),
      sound: true
    })
  })

  process.exit(0)
}

async function $CHILDS_REQUIRED(args: string) {
  if (!(Project.Current as Project).isWorkspaceChildProject) {
    Helpers.error(`Not worksapce child`, false, true);
  }
  console.log((Project.Current as Project).sortedRequiredWorkspaceDependencies.map(c => c.name));
  process.exit(0)
}

export async function $ALL_PROJECTS(args: string) {
  const db = await TnpDB.Instance();
  const projects = (await db.getProjects()).map(p => p.project as Project);
  console.log(projects.map(p => p.info).join('\n'));
  process.exit(0)
}

export async function $INFO() {
  const proj = Project.Current as Project;
  console.clear()
  console.info(`

  name: ${proj.name}
  version: ${proj.version}
  last npm version: ${proj.lastNpmVersion}
  frameworkVersion: ${proj._frameworkVersion}
  genericName: ${proj.genericName}
  isStandaloneProject: ${proj.isStandaloneProject}
  isGenerated: ${proj.isGenerated}
  isCoreProject: ${proj.isCoreProject}
  type: ${proj._type}
  parent name: ${proj.parent && proj.parent.name}
  grandpa name: ${proj.grandpa && proj.grandpa.name}
  git origin: ${proj.git.originURL}
  git branch name: ${proj.git.currentBranchName}
  git commits number: ${proj.git.countComits()}

  `)
  process.exit(0)
}

const $CHECK = async () => {
  await $INFO();
}

const $FORK = async (args: string) => {
  const argv = args.trim().split(' ');
  const githubUrl = _.first(argv);
  let projectName = _.last(githubUrl.replace('.git', '').split('/'));
  if (argv.length > 1) {
    projectName = argv[1];
  }
  Helpers.info(`Forking ${githubUrl} with name ${projectName}`);
  Project.Current.run(`git clone ${githubUrl} ${projectName}`).sync();
  let newProj = Project.From(path.join(Project.Current.location, projectName)) as Project;
  Helpers.setValueToJSON(path.join(newProj.location, config.file.package_json), 'name', projectName);
  Helpers.setValueToJSON(path.join(newProj.location, config.file.package_json), 'version', '0.0.0');
  if (newProj.containsFile('angular.json')) {
    Helpers.setValueToJSON(path.join(newProj.location, config.file.package_json), 'tnp.type', 'angular-lib');
    Helpers.setValueToJSON(path.join(newProj.location, config.file.package_json), 'tnp.version', 'v2');
    Helpers.setValueToJSON(path.join(newProj.location, config.file.package_json), 'scripts', {});
    // const dependencies = Helpers.readValueFromJson(path.join(newProj.location, config.file.package_json), 'dependencies') as Object;
    newProj.run(`tnp init`).sync();
    newProj = Project.From(path.join(Project.Current.location, projectName)) as Project;
    newProj.removeFile('.browserslistrc');
  }
  Helpers.writeFile(path.join(newProj.location, config.file.README_MD), `
# ${projectName}

based on ${githubUrl}

  `);
  Helpers.run(`code ${newProj.location}`).sync();
  Helpers.info(`Done`);
  process.exit(0);
}

export default {
  $INFO: Helpers.CLIWRAP($INFO, '$INFO'),
  $CHECK: Helpers.CLIWRAP($CHECK, '$CHECK'),
  $ALL_PROJECTS: Helpers.CLIWRAP($ALL_PROJECTS, '$ALL_PROJECTS'),
  $CHILDS_REQUIRE: Helpers.CLIWRAP($CHILDS_REQUIRED, '$CHILDS_REQUIRED'),
  $DEVELOP: Helpers.CLIWRAP($DEVELOP, '$DEVELOP'),
  killvscode: Helpers.CLIWRAP(killvscode, 'killvscode'),
  vscodekill: Helpers.CLIWRAP(vscodekill, 'vscodekill'),
  close: Helpers.CLIWRAP(close, 'close'),
  $KILL_ON_PORT: Helpers.CLIWRAP($KILL_ON_PORT, '$KILL_ON_PORT'),
  $KILLONPORT: Helpers.CLIWRAP($KILLONPORT, '$KILLONPORT'),
  $KILLALL: Helpers.CLIWRAP($KILLALL, '$KILLALL'),
  $KILLALLNODE: Helpers.CLIWRAP($KILLALLNODE, '$KILLALLNODE'),
  $KILLWORKER: Helpers.CLIWRAP($KILLWORKER, '$KILLWORKER'),
  CHOKI: Helpers.CLIWRAP(CHOKI, 'CHOKI'),
  NOT: Helpers.CLIWRAP(NOT, 'NOT'),
  $FORK: Helpers.CLIWRAP($FORK, '$FORK'),
}
