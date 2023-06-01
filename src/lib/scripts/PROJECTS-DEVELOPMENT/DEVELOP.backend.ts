//#region imports
import { _, crossPlatformPath } from 'tnp-core';
import { fse } from 'tnp-core'
import { Project } from '../../project';
import { Helpers } from 'tnp-helpers';
import { path } from 'tnp-core'
import { config } from 'tnp-config';
import { chokidar } from 'tnp-core';
import { notify } from 'node-notifier';
import { CLASS } from 'typescript-class-helpers';
import * as open from 'open';
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

const $KILLALLNODE = () => {
  try {
    if (process.platform === 'win32') {
      Helpers.run(`taskkill /f /im node.exe`, { output: false, silence: true }).sync();
    } else {
      Helpers.run(`fkill -f node`, { output: false, silence: true }).sync();
    }
  } catch (error) {
    Helpers.error(`[${config.frameworkName}] not able to kill all node processes`)
  }
  Helpers.info('DONE KILL ALL NODE PROCESSES')
  process.exit(0);
}

const $KILLNODE = () => {
  $KILLALLNODE()
}


const $KILLALLCODE = () => {
  if (process.platform === 'win32') {
    Helpers.run(`taskkill /f /im code.exe`).sync();
    return;
  }
  Helpers.run(`fkill -f code`).sync();
  process.exit(0);
}

const $KILLCODE = () => {
  $KILLALLCODE()
}

//#endregion

//#region develop
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
  // if (args?.trim() !== '') {
  //   if (!path.isAbsolute(args)) {
  //     args = path.join(process.cwd(), args);
  //   }
  //   const exists = Helpers.exists(args);
  //   const isFolder = Helpers.isFolder(args);
  //   const isFile = !isFolder;
  //   const isExistedSymlink = Helpers.isExistedSymlink(args);
  //   const isUnexistedLink = Helpers.isUnexistedLink(args);
  //   const size = Helpers.size(args);
  //   Helpers.info(`
  //   path: ${args}
  //   cross platforma path: ${crossPlatformPath(args)}
  //   exists: ${exists}
  //   isFolder: ${isFolder}
  //   isFile: ${isFile}
  //   isExistedSymlink: ${isExistedSymlink}
  //   isUnexistedLink: ${isUnexistedLink}
  //   size: ${size} bytes

  //   `)
  // } else {
  let proj = Helpers.cliTool.resolveChildProject(args, Project.Current) as Project;
  // console.clear()
  console.info(`

    name: ${proj.name}
    version: ${proj.version}
    private: ${proj.isPrivate}
    monorepo: ${proj.isMonorepo}

    isStandaloneProject: ${proj.isStandaloneProject}
    isGenerated: ${proj.isGenerated}
    isCoreProject: ${proj.isCoreProject}
    isSmartContainer: ${proj.isSmartContainer}
    isSmartContainerChild: ${proj.isSmartContainerChild}
    isSmartContainerTarget: ${proj.isSmartContainerTarget}
    isSmartContainerTargetNonClient: ${proj.isSmartContainerTargetNonClient}

    genericName: ${proj.genericName}

    last npm version: ${proj.lastNpmVersion}
    frameworkVersion: ${proj._frameworkVersion}
    type: ${proj._type}
    parent name: ${proj.parent && proj.parent.name}
    grandpa name: ${proj.grandpa && proj.grandpa.name}
    git origin: ${proj.git.originURL}
    git branch name: ${proj.git.currentBranchName}
    git commits number: ${proj.git.countComits()}

    location: ${proj.location}

    `)
  // }

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

export async function $DIFF() {

  const proj = Project.Current as Project;
  const changesFilePath = await proj.gitActions.containerChangeLog(proj, proj.children);
  await open(changesFilePath)
  process.exit(0);
}

export default {
  //#region export default
  $DIFF: Helpers.CLIWRAP($DIFF, '$DIFF'),
  $WATCHERS: Helpers.CLIWRAP($WATCHERS, '$WATCHERS'),
  $TARGET_PROJ_UPDATE: Helpers.CLIWRAP($TARGET_PROJ_UPDATE, '$TARGET_PROJ_UPDATE'),
  $INFO: Helpers.CLIWRAP($INFO, '$INFO'),
  $CHECK: Helpers.CLIWRAP($CHECK, '$CHECK'),
  $CHILDS_REQUIRE: Helpers.CLIWRAP($CHILDS_REQUIRED, '$CHILDS_REQUIRED'),
  killvscode: Helpers.CLIWRAP(killvscode, 'killvscode'),
  vscodekill: Helpers.CLIWRAP(vscodekill, 'vscodekill'),
  close: Helpers.CLIWRAP(close, 'close'),
  $KILL_ON_PORT: Helpers.CLIWRAP($KILL_ON_PORT, '$KILL_ON_PORT'),
  $KILLONPORT: Helpers.CLIWRAP($KILLONPORT, '$KILLONPORT'),
  $KILLALLNODE: Helpers.CLIWRAP($KILLALLNODE, '$KILLALLNODE'),
  $KILLNODE: Helpers.CLIWRAP($KILLNODE, '$KILLNODE'),
  $KILLALLCODE: Helpers.CLIWRAP($KILLALLCODE, '$KILLALLCODE'),
  $KILLCODE: Helpers.CLIWRAP($KILLCODE, '$KILLCODE'),
  CHOKI: Helpers.CLIWRAP(CHOKI, 'CHOKI'),
  NOT: Helpers.CLIWRAP(NOT, 'NOT'),
  $FORK: Helpers.CLIWRAP($FORK, '$FORK'),
  $SYNC_TO: Helpers.CLIWRAP($SYNC_TO, '$SYNC_TO'),
  $SYNC_FROM: Helpers.CLIWRAP($SYNC_FROM, '$SYNC_FROM'),
  //#endregion
}
