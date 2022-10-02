//#region imports
import { _, crossPlatformPath } from 'tnp-core';
import { fse } from 'tnp-core'
import { Project } from '../../project';
import { Helpers } from 'tnp-helpers';
import { path } from 'tnp-core'
import { config } from 'tnp-config';
import { TnpDB } from 'tnp-db';
import { chokidar } from 'tnp-core';
import { notify } from 'node-notifier';
import { CLASS } from 'typescript-class-helpers';
import chalk from 'chalk';
import { URL } from 'url';
//#endregion

//#region sync to/from
async function $SYNC_TO(args) {
  const { resolved: destinationIps } = Helpers.cliTool.argsFromBegin<URL>(args, ip => {
    return Helpers.urlParse(ip);
  });

  if (destinationIps.length > 0) {
    //#region notify sync server
    // const db = await TnpDB.Instance();
    // const projects = (await db.getProjects()).map(p => p.project) as Project[];
    // const res = await Helpers.autocompleteAsk(`Select project to sync notify`,
    //   projects.map(p => {
    //     return { name: p.genericName, value: p.genericName }
    //   })
    // )
    // for (let index = 0; index < destinationIps.length; index++) {
    //   const server = destinationIps[index];

    // }
    //#endregion
  } else {
    //#region sync to destination location
    const { resolved: destinaitonProjects, commandString } = Helpers.cliTool.argsFromBegin<Project>(args, location => {
      return Project.From(location);
    });

    args = commandString;
    const currentProj = (Project.Current as Project);
    const toSync = [
      ...(currentProj.typeIs('angular-lib') ? [config.folder.components] : []),
      ...(currentProj.typeIsNot('unknow', 'unknow-npm-project') ? [config.folder.src] : []),
    ];
    Helpers.info(`Folder to sync: ${toSync.join(',')}`)
    if (destinaitonProjects.length === 0) {
      Helpers.error(`No project to sync`, false, true);
    }

    let destProj = _.first(destinaitonProjects);
    if (destProj.isContainer) {
      const properContainerChild = destProj.children.find(c => c.name === currentProj.name);
      destProj = properContainerChild;
    }

    if (!destProj || destProj.name !== currentProj.name) {
      Helpers.error(`You can only sync projects with same name`, false, true);
    }

    for (let j = 0; j < toSync.length; j++) {
      const source = path.join(currentProj.location, toSync[j]);
      Helpers.info(`
        source: ${currentProj.genericName}
        destination:${destProj.genericName}
      `);
      chokidar.watch([source], {
        ignoreInitial: false,
        followSymlinks: false,
        ignorePermissionErrors: true,
      }).on('all', async (event, f) => {
        if (event !== 'addDir' && event !== 'unlinkDir') {
          const dest = path.join(destProj.location, toSync[j], f.replace(source, ''));
          if (!Helpers.exists(path.dirname(dest))) {
            Helpers.mkdirp(path.dirname(dest));
          }
          Helpers.copyFile(f, dest);
          Helpers.log(`Copy: ${dest}`);
        }
      });
    }

    //#endregion
  }

}

function $SYNC_FROM(args) {
  // //#region resolve projects
  // const { resolved: sourceProjects, commandString } = Helpers.cliTool.argsFromBegin<Project>(args, location => {
  //   return Project.From(location)
  // });

  // args = commandString;
  // const currentProj = (Project.Current as Project);
  // const toSync = [
  //   ...(currentProj.typeIs('angular-lib') ? [config.folder.components] : []),
  //   ...(currentProj.typeIsNot('unknow', 'unknow-npm-project') ? [config.folder.src] : []),
  //   config.folder.dist,
  // ];
  // Helpers.info(`Folder to sync: ${toSync.join(',')}`)
  // if (sourceProjects.length === 0) {
  //   Helpers.error(`No project to sync`, false, true);
  // }
  // const sourceProject = _.first(sourceProjects);
  // if (sourceProject.name !== currentProj.name) {
  //   Helpers.error(`Projects are not with the same name:
  //   source:  ${sourceProject.name}
  //   current: ${currentProj.name}
  //   `, false, true);
  // }
  // //#endregion
  // const projects = {
  //   current: currentProj,
  //   source: sourceProject,
  // };

  // const foldersToSyncFromSource = toSync.map(folder => {
  //   return `${sourceProject.location}/`;
  // });

  // for (let index = 0; index < foldersToSyncFromSource.length; index++) {
  //   const destProj = foldersToSyncFromSource[index];

  //   // for (let j = 0; j < toSync.length; j++) {
  //   //   const source = path.join(currentProj.location, toSync[j]);
  //   //   Helpers.info(`
  //   //   source: ${currentProj.genericName}
  //   //   destination:${destProj.genericName}
  //   // `);
  //   //   chokidar.watch([source], {
  //   //     ignoreInitial: false,
  //   //     followSymlinks: false,
  //   //     ignorePermissionErrors: true,
  //   //   }).on('all', async (event, f) => {
  //   //     if (event !== 'addDir' && event !== 'unlinkDir') {
  //   //       const dest = path.join(destProj.location, toSync[j], f.replace(source, ''));
  //   //       Helpers.copyFile(f, dest);
  //   //       Helpers.log(`Copy: ${dest}`);
  //   //     }
  //   //   });
  //   // }

  // }

}
//#endregion

//#region kill
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
  if (process.platform === 'win32') {
    Helpers.run(`taskkill /f /im node.exe`).sync();
    return;
  }
  Helpers.run(`fkill -f node`).sync();
}

const $KILLWORKER = async () => {
  const db = await TnpDB.Instance();
  await db.killWorker();
  Helpers.info(`Done killing worker`);
  process.exit(0)
}
//#endregion

//#region develop
export async function $DEVELOP(args: string, exit = true) {
  // console.log('adasdas')
  const { kill = false } = require('minimist')(!args ? [] : args.split(' '));
  const projectsToOpen = args.trim().split(' ');
  const projectForAction: Project[] = [];

  const db = await TnpDB.Instance();
  // @ts-ignore
  let projects = (await db.getProjects()).map(p => p.project as Project)
    .filter(p => !p.isGenerated && !p.isGeneratedForRelease);

  const projs = path.join((Project.Tnp as Project).location, '../..');

  const unknowNPm: Project[] = [];
  if (fse.existsSync(projs)) {

    Helpers.foldersFrom(projs).forEach(folderWithProjects => {
      projects = projects.concat(fse.readdirSync(folderWithProjects)
        .map(f => {
          f = path.join(projs, f);
          const proj = Project.From<Project>(f)
          // console.log(`${f} proj name: ${proj && proj.name}`);
          if (proj) {
            unknowNPm.push(proj)
          }
          return proj;
        }));
    })


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

function vscodekill(args) {
  killvscode(args);
}

function close(args) {
  killvscode(args);
}
//#endregion

//#region choki
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
//#endregion

//#region info / check
export async function $INFO(args: string) {
  if (args?.trim() !== '') {
    if (!path.isAbsolute(args)) {
      args = path.join(process.cwd(), args);
    }
    const exists = Helpers.exists(args);
    const isFolder = Helpers.isFolder(args);
    const isFile = !isFolder;
    const isExistedSymlink = Helpers.isExistedSymlink(args);
    const isUnexistedLink = Helpers.isUnexistedLink(args);
    const size = Helpers.size(args);
    Helpers.info(`
    path: ${args}
    cross platforma path: ${crossPlatformPath(args)}
    exists: ${exists}
    isFolder: ${isFolder}
    isFile: ${isFile}
    isExistedSymlink: ${isExistedSymlink}
    isUnexistedLink: ${isUnexistedLink}
    size: ${size} bytes

    `)
  } else {
    const proj = Project.Current as Project;
    // console.clear()
    console.info(`

    name: ${proj.name}
    version: ${proj.version}
    private: ${proj.isPrivate}
    monorepo: ${proj.isMonorepo}
    isSmartContainer: ${proj.isSmartContainer}
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
  }

  process.exit(0)
}

const $CHECK = async (args) => {
  await $INFO(args);
}
//#endregion

//#region fork
const $FORK = async (args: string) => {
  const argv = args.trim().split(' ');
  const githubUrl = _.first(argv);
  let projectName = _.last(githubUrl.replace('.git', '').split('/'));
  if (argv.length > 1) {
    projectName = argv[1];
  }
  Helpers.info(`Forking ${githubUrl} with name ${projectName}`);
  Project.Current.git.clone(githubUrl, projectName);
  let newProj = Project.From(path.join(Project.Current.location, projectName)) as Project;
  Helpers.setValueToJSON(path.join(newProj.location, config.file.package_json), 'name', projectName);
  Helpers.setValueToJSON(path.join(newProj.location, config.file.package_json), 'version', '0.0.0');
  if (newProj.containsFile('angular.json')) {
    Helpers.setValueToJSON(path.join(newProj.location, config.file.package_json), 'tnp.type', 'angular-lib');
    Helpers.setValueToJSON(path.join(newProj.location, config.file.package_json), 'tnp.version', 'v2');
    Helpers.setValueToJSON(path.join(newProj.location, config.file.package_json), 'scripts', {});
    // const dependencies = Helpers.readValueFromJson(path.join(newProj.location, config.file.package_json), 'dependencies') as Object;
    newProj.run(`${config.frameworkName} init`).sync();
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
//#endregion

//#region childs requried
async function $CHILDS_REQUIRED(args: string) {
  if (!(Project.Current as Project).isWorkspaceChildProject) {
    Helpers.error(`Not worksapce child`, false, true);
  }
  console.log((Project.Current as Project).sortedRequiredWorkspaceDependencies.map(c => c.name));
  process.exit(0)
}
//#endregion

//#region all projects
export async function $ALL_PROJECTS(args: string) {
  //#region @backend
  const db = await TnpDB.Instance();
  // @ts-ignore
  const projects = (await db.getProjects()).map(p => p.project as Project);
  console.log(projects.map(p => p.info).join('\n'));
  process.exit(0)
  //#endregion
}
//#endregion

export async function $NAME_TEST() {
  // CLASS.getConfig($NAME_TEST)[0].
  console.log(CLASS.getName($NAME_TEST))
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

async function $TARGET_PROJ_UPDATE() {
  (Project.Current as Project).targetProjects.update();
  process.exit(0)
}

function $WATCHERS() {
  Helpers.run(`find /proc/*/fd -user "$USER" -lname anon_inode:inotify -printf '%hinfo/%f\n' 2>/dev/null | xargs cat | grep -c '^inotify'`).sync();
  process.exit(0)
}

export default {
  //#region export default
  $WATCHERS: Helpers.CLIWRAP($WATCHERS, '$WATCHERS'),
  $TARGET_PROJ_UPDATE: Helpers.CLIWRAP($TARGET_PROJ_UPDATE, '$TARGET_PROJ_UPDATE'),
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
  $SYNC_TO: Helpers.CLIWRAP($SYNC_TO, '$SYNC_TO'),
  $SYNC_FROM: Helpers.CLIWRAP($SYNC_FROM, '$SYNC_FROM'),
  //#endregion
}
