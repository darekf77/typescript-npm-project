//#region imports
import { _, crossPlatformPath } from 'tnp-core';
import { fse } from 'tnp-core'
import { Project } from '../../project';
import { Helpers } from 'tnp-helpers';
import { path } from 'tnp-core'
import { config } from 'tnp-config';
// const { notify } = require('node-notifier');
import { CLASS } from 'typescript-class-helpers';
// import toast from 'powertoast';
import * as open from 'open';
import chalk from 'chalk';
import { URL } from 'url';
import { incrementalWatcher, IncrementalWatcherOptions } from 'incremental-compiler';
import { PackagesRecognition } from 'tnp/project/features/package-recognition/packages-recognition';
import { BrowserCodeCut } from 'tnp/project/compilers/build-isomorphic-lib/code-cut/browser-code-cut.backend';

//#endregion

//#region not
async function NOT(args: string) {
  // _.times(10, (n) => {
  // console.log(notify)
  // toast(
  //   {
  //     title: 'My awesome title',
  //     message: 'Hello from node, Mr. User!',
  //     // icon: path.join(__dirname, 'coulson.jpg'), // Absolute path (doesn't work on balloons)
  //     // sound: true, // Only Notification Center or Windows Toasters
  //     // wait: true // Wait with callback, until user action is taken against notification, does not apply to Windows Toasters as they always wait or notify-send as it does not support the wait option
  //   },
  // );

  // })

  process.exit(0)
}
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
    // const { resolved: destinaitonProjects, commandString } = Helpers.cliTool.argsFromBegin<Project>(args, location => {
    //   return Project.From(location);
    // });

    // args = commandString;
    // const currentProj = (Project.Current as Project);
    // const toSync = [
    //   ...(currentProj.typeIsNot('unknow', 'unknow-npm-project') ? [config.folder.src] : []),
    // ];
    // Helpers.info(`Folder to sync: ${toSync.join(',')}`)
    // if (destinaitonProjects.length === 0) {
    //   Helpers.error(`No project to sync`, false, true);
    // }

    // let destProj = _.first(destinaitonProjects);
    // if (destProj.isContainer) {
    //   const properContainerChild = destProj.children.find(c => c.name === currentProj.name);
    //   destProj = properContainerChild;
    // }

    // if (!destProj || destProj.name !== currentProj.name) {
    //   Helpers.error(`You can only sync projects with same name`, false, true);
    // }

    // for (let j = 0; j < toSync.length; j++) {
    //   const source = path.join(currentProj.location, toSync[j]);
    //   Helpers.info(`
    //     source: ${currentProj.genericName}
    //     destination:${destProj.genericName}
    //   `);
    //   incrementalWatcher([source], {
    //     ignoreInitial: false,
    //     followSymlinks: false,
    //      ...COMPILER_POOLING,
    //   }).on('all', async (event, f) => {
    //     if (event !== 'addDir' && event !== 'unlinkDir') {
    //       const dest = path.join(destProj.location, toSync[j], f.replace(source, ''));
    //       if (!Helpers.exists(path.dirname(dest))) {
    //         Helpers.mkdirp(path.dirname(dest));
    //       }
    //       Helpers.copyFile(f, dest);
    //       Helpers.log(`Copy: ${dest}`);
    //     }
    //   });
    // }

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
  //   //   await (incrementalWatcher([source], {
  //   //     ignoreInitial: false,
  //   //     followSymlinks: false,
  //   //     ...COMPILER_POOLING,
  //   //   })).on('all', async (event, f) => {
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
    process.exit(0);
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

//#region target proj update
async function $TARGET_PROJ_UPDATE() {
  (Project.Current as Project).targetProjects.update();
  process.exit(0)
}
//#endregion

//#region watcher
function $WATCHERS() {
  Helpers.run(`find /proc/*/fd -user "$USER" -lname anon_inode:inotify -printf '%hinfo/%f\n' 2>/dev/null | xargs cat | grep -c '^inotify'`).sync();
  process.exit(0)
}
//#endregion

//#region diff
export async function $DIFF() {
  const proj = Project.Current as Project;
  const changesFilePath = await proj.gitActions.containerChangeLog(proj, proj.children);
  await open(changesFilePath)
  process.exit(0);
}
//#endregion

//#region show override
export async function $SHOW_OVERRIDE() {

  const proj = Project.Current as Project;

  const children = proj.children;

  for (let index = 0; index < children.length; index++) {
    const child = children[index] as Project;
    const override = child.packageJson.data.tnp?.overrided?.dependencies
    console.log(`
    ${child.genericName} OVERRIDE ${_.keys(override).length}
${_.keys(override).length > 0 ? _.keys(override).map((key, index) => `-${key}:${override[key]}\n`) : ''}`);
  }

  process.exit(0);
}
//#endregion

//#region remove bad tag
export async function $REMOVE_BAD_TAG(args: string) {
  //#region @notForNpm
  const proj = Project.Current as Project;
  const trusted = proj.trusted.filter(f => {
    return ![
      "typeorm",
      "ng-talkback",
      "record-replay-req-res-scenario",
      "vpn-split",
      "node-cli-tester",
    ].includes(f);
  })
  const max = Number(args.trim());
  for (let index = 0; index < trusted.length; index++) {
    const name = trusted[index];

    const child = Project.From([proj.location, name]) as Project;


    // const command = `git log --all --grep='build hash update ${tag.replace('v', '')}'`;

    while (true) {
      let tag = child.git.lastTagNameForMajorVersion(max)?.replace('v', '');
      console.info(`

    CHECKIGN CHILD: ${name}, TAG: ${tag}`)

      if (!tag) {
        Helpers.warn(`CHILD: ${child.name} NO TAG ${tag}`);
        Helpers.pressKeyAndContinue();
      }
      try {
        const cmd = `npm view ${child.name}@${tag.replace('v', '')}  version`;
        console.log({ cmd })
        child.run(cmd, { output: true }).sync();
        Helpers.info(`CHILD: ${child.name} IS OK, last ver/tag ${tag}`);
        break;
      } catch (error) {
        const [majorProper, minorProper] = tag.replace('v', '').split('.');
        const proper = _.last(JSON.parse(child.run(`npm view ${child.name}@${majorProper}.${minorProper}  version --json`, { output: false, }).sync().toString()));
        Helpers.warn(`CHILD: ${child.name} NOT OK,

        last ver/tag ${tag}

        OK VERSION IS ${proper}

        `);
        Helpers.pressKeyAndContinue(`Press any key to delete bad tag and check again.`);
        child.run(`git tag -d v${tag} && git push origin :refs/tags/v${tag}`, { output: true }).sync();
      }
    }

  }
  //#endregion
  process.exit(0)
}
//#endregion

//#region move js to ts
export function $MOVE_JS_TO_TS(args) {
  Helpers
    .filesFrom(crossPlatformPath([process.cwd(), args]), true)
    .forEach(f => {
      if (path.extname(f) === '.js') {
        Helpers.move(f, crossPlatformPath([path.dirname(f), path.basename(f).replace('.js', '.ts')]))
      }
    })
  Helpers.info('DONE')
  process.exit(0)
}
//#endregion


export async function PROPERWATCHERTEST(engine: string) {
  const proj = Project.Current as Project;
  const watchLocation = crossPlatformPath([proj.location, config.folder.src]);
  const symlinkCatalog = crossPlatformPath([proj.location, 'symlinkCatalog']);
  const symlinkCatalogInWatch = crossPlatformPath([watchLocation, 'symlink']);
  const symlinkCatalogFile = crossPlatformPath([proj.location, 'symlinkCatalog', 'dupa.txt']);
  const options: IncrementalWatcherOptions = {
    name: `[firedev]  properwatchtest (testing only)`,
    ignoreInitial: true,
  };

  Helpers.remove(symlinkCatalog);
  Helpers.writeFile(symlinkCatalogFile, 'hello dupa');
  Helpers.writeFile(crossPlatformPath([proj.location, config.folder.src, 'a1', 'aa']), 'asdasdasdhello dupa');
  Helpers.writeFile(crossPlatformPath([proj.location, config.folder.src, 'a2', 'ccc']), 'heasdasdllo asdasd');
  Helpers.createSymLink(symlinkCatalog, symlinkCatalogInWatch);

  (await incrementalWatcher(watchLocation, options)).on('all', (a, b) => {
    console.log('FIRSTA', a, b);
  });

  (await incrementalWatcher(watchLocation, options)).on('all', (a, b) => {
    console.log('SECOND', a, b);
  });

  (await incrementalWatcher(symlinkCatalog, options)).on('all', (a, b) => {
    console.log('THIRD', a, b);
  });

  console.log('await done');
}

async function ADD_IMPORT_SRC() {
  const project = Project.Current as Project;


  const regexEnd = /from\s+(\'|\").+(\'|\")/g;
  const singleLineImporrt = /import\((\'|\"|\`).+(\'|\"|\`)\)/g;
  const singleLineRequire = /require\((\'|\"|\`).+(\'|\"|\`)\)/g;
  const srcEnd = /\/src(\'|\"|\`)/;
  const betweenApos = /(\'|\"|\`).+(\'|\"|\`)/g;

  const commentMultilieStart = /^\/\*/;
  const commentSingleLineStart = /^\/\//;

  const processAddSrcAtEnd = (regexEnd: RegExp, line: string, packages: string[], matchType: 'from_import_export' | 'imports' | 'require'): string => {
    const matches = line.match(regexEnd);
    const firstMatch = _.first(matches) as string;
    const importMatch = (_.first(firstMatch.match(betweenApos)) as string).replace(/(\'|\"|\`)/g, '');
    const isOrg = importMatch.startsWith('@');
    const packageName = importMatch.split('/').slice(0, isOrg ? 2 : 1).join('/');
    if (packages.includes(packageName) && !srcEnd.test(firstMatch)) {
      let clean: string;
      if (matchType === 'require' || matchType === 'imports') {
        const endCharacters = firstMatch.slice(-2);
        clean = firstMatch.slice(0, firstMatch.length - 2) + '/src' + endCharacters;
      } else {
        let endCharacters = firstMatch.slice(-1);
        clean = firstMatch.slice(0, firstMatch.length - 1) + '/src' + endCharacters;
      }

      return line.replace(firstMatch, clean);
    }
    return line;
  }

  const changeImport = (content: string, packages: string[]) => {
    return content.split(/\r?\n/).map((line, index) => {
      const trimedLine = line.trimStart();
      if (commentMultilieStart.test(trimedLine) || commentSingleLineStart.test(trimedLine)) {
        return line;
      }
      if (regexEnd.test(line)) {
        return processAddSrcAtEnd(regexEnd, line, packages, 'from_import_export');
      }
      if (singleLineImporrt.test(line)) {
        return processAddSrcAtEnd(singleLineImporrt, line, packages, 'imports');
      }
      if (singleLineRequire.test(line)) {
        return processAddSrcAtEnd(singleLineRequire, line, packages, 'require');
      }
      return line;
    }).join('\n') + '\n';
  };

  const addImportSrc = (proj: Project) => {
    PackagesRecognition.fromProject(proj).start(true, 'src adding process');
    const pacakges = [
      ...BrowserCodeCut.IsomorphicLibs,
      ...(proj.isSmartContainerChild ? proj.parent.children.map(c => `@${proj.parent.name}/${c.name}`) : []),
    ];
    // console.log(pacakges)

    const files = Helpers.filesFrom(proj.pathFor('src'), true).filter(f => f.endsWith('.ts'));

    for (const file of files) {
      const originalContent = Helpers.readFile(file);
      const changed = changeImport(originalContent, pacakges);
      if (originalContent && changed && originalContent?.trim().replace(/\s/g, '') !== changed?.trim().replace(/\s/g, '')) {
        Helpers.writeFile(file, changed);
      }
    }
  };

  if (project.isStandaloneProject) {
    addImportSrc(project);
  } else if (project.isContainer) {
    for (const child of project.children) {
      addImportSrc(child);
    }
  }

  process.exit(0);
}

export default {
  //#region export default
  ADD_IMPORT_SRC: Helpers.CLIWRAP(ADD_IMPORT_SRC, 'ADD_IMPORT_SRC'),
  PROPERWATCHERTEST: Helpers.CLIWRAP(PROPERWATCHERTEST, 'PROPERWATCHERTEST'),
  $REMOVE_BAD_TAG: Helpers.CLIWRAP($REMOVE_BAD_TAG, '$REMOVE_BAD_TAG'),
  $MOVE_JS_TO_TS: Helpers.CLIWRAP($MOVE_JS_TO_TS, '$MOVE_JS_TO_TS'),
  $DIFF: Helpers.CLIWRAP($DIFF, '$DIFF'),
  $SHOW_OVERRIDE: Helpers.CLIWRAP($SHOW_OVERRIDE, '$SHOW_OVERRIDE'),
  $WATCHERS: Helpers.CLIWRAP($WATCHERS, '$WATCHERS'),
  $TARGET_PROJ_UPDATE: Helpers.CLIWRAP($TARGET_PROJ_UPDATE, '$TARGET_PROJ_UPDATE'),
  $INFO: Helpers.CLIWRAP($INFO, '$INFO'),
  $CHECK: Helpers.CLIWRAP($CHECK, '$CHECK'),
  killvscode: Helpers.CLIWRAP(killvscode, 'killvscode'),
  vscodekill: Helpers.CLIWRAP(vscodekill, 'vscodekill'),
  close: Helpers.CLIWRAP(close, 'close'),
  $KILL_ON_PORT: Helpers.CLIWRAP($KILL_ON_PORT, '$KILL_ON_PORT'),
  $KILLONPORT: Helpers.CLIWRAP($KILLONPORT, '$KILLONPORT'),
  $KILLALLNODE: Helpers.CLIWRAP($KILLALLNODE, '$KILLALLNODE'),
  $KILLNODE: Helpers.CLIWRAP($KILLNODE, '$KILLNODE'),
  $KILLALLCODE: Helpers.CLIWRAP($KILLALLCODE, '$KILLALLCODE'),
  $KILLCODE: Helpers.CLIWRAP($KILLCODE, '$KILLCODE'),
  NOT: Helpers.CLIWRAP(NOT, 'NOT'),
  $FORK: Helpers.CLIWRAP($FORK, '$FORK'),
  $SYNC_TO: Helpers.CLIWRAP($SYNC_TO, '$SYNC_TO'),
  $SYNC_FROM: Helpers.CLIWRAP($SYNC_FROM, '$SYNC_FROM'),
  //#endregion
}
