//#region imports
import { _, crossPlatformPath } from 'tnp-core/src';
import { path } from 'tnp-core/src'
import { fse } from 'tnp-core/src'
import * as open from 'open';
import { glob } from 'tnp-core/src';
import chalk from 'chalk';
import { Project } from '../../project/abstract/project';
import { Helpers } from 'tnp-helpers/src';
import { config } from 'tnp-config/src';
import { resolvePacakgesFromArgs } from '../../project/features/npm-packages/npm-packages-helpers.backend';

import { $VSCODE_TEMP_HIDE, $VSCODE_TEMP_SHOW } from '../VSCODE-EXT/VSCODE.backend';
//#endregion

//#region copyto

//#region copy module to
async function copyModuleto(args: string) {
  let [packageName, project]: [string, (Project | string)] = args.split(' ') as any;
  if (_.isString(packageName) && packageName.trim() !== '' && _.isString(project) && project.trim() !== '') {
    if (packageName.startsWith(`${config.folder.node_modules}/`)) {
      packageName = packageName.replace(`${config.folder.node_modules}/`, '')
    }
    if (!path.isAbsolute(project)) {
      project = Project.From<Project>(path.join(process.cwd(), project)) as Project;
    } else {
      project = Project.From<Project>(project) as Project;
    }

    await project.node_modules.copy(packageName).to(project);
    Helpers.info(`Copy DONE`)
  } else {
    Helpers.error(`Bad argument for ${chalk.bold('copy to module')} : "${args}"`)
  }
  process.exit(0)
}
//#endregion

//#region copy to destination

function copyToDestination(destLocaiton) {

  const currentLib = Project.Current;
  const destination = Project.From<Project>(destLocaiton);
  if (!destination) {
    Helpers.error(`Incorect project in: ${destLocaiton}`)
  }
  currentLib.copyManager.copyBuildedDistributionTo(destination);
  Helpers.info(`Project "${chalk.bold(currentLib.name)}" successfully installed in "${destination.name}"`);
}
//#endregion

//#region copyto handle args
function copyToHandleArgs(args: string) {

  const destLocaitons = args.split(' ').filter(a => a.trim() !== '');

  destLocaitons.forEach(c => copyToDestination(c));


  process.exit(0)
}
//#endregion

//#endregion

//#region install / uninstall npm pacakges
export async function $INSTALL(args, exit = true) {
  const proj = Project.Current as Project;

  if (proj.isContainer && !proj.isContainerCoreProject) {
    const children = proj.children.filter(c => c.npmPackages.useSmartInstall);
    for (let i = 0; i < children.length; i++) {
      const c = children[i];
      c.npmPackages.installFromArgs(args);
    }
  } else {
    proj.npmPackages.installFromArgs(args);
  }
  if (exit) {
    process.exit(0);
  }
}

export async function $UNINSTALL(args: string, exit = true) {
  const proj = Project.Current as Project;

  if (proj.isContainer && !proj.isContainerCoreProject) {
    const children = proj.children.filter(c => c.npmPackages.useSmartInstall);
    for (let i = 0; i < children.length; i++) {
      const c = children[i];
      if (args.trim() === '') {
        c.node_modules.remove(`container uninstall npm`);
      } else {
        c.npmPackages.uninstallFromArgs(args);
      }
    }
  } else {
    proj.npmPackages.uninstallFromArgs(args);
  }
  if (exit) {
    process.exit(0);
  }
}
const $I = (args) => {
  $INSTALL(args);
};

const $SINSTALL = (args) => {
  $INSTALL(args, true);
}


const SMART_REINSTALL = async (args) => {
  const proj = Project.Current as Project;

  if (proj.isContainer) {
    const children = proj.children.filter(c => c.frameworkVersionAtLeast('v3') && c.typeIs('isomorphic-lib') && c.npmPackages.useSmartInstall);
    for (let index = 0; index < children.length; index++) {
      const c = children[index];
      Helpers.info(`Recreating node_module for ${c.genericName}`)
      c.node_modules.remove();
      c.smartNodeModules.remove();
      await c.filesStructure.init('');
    }
  } else {
    Helpers.error(`[${config.frameworkName}] This is not a container type project.`, false, true);
  }

  process.exit(0);
};

const $REINSTALL = async (args) => {
  const proj = Project.Current as Project;

  if (proj.isContainer) {
    if (proj.isContainerCoreProject) {
      proj.node_modules.remove();
      proj.smartNodeModules.remove();
      proj.run(`${config.frameworkName} install`).sync();
      Helpers.info(`Reinstal done for core container`);
    } else {
      // smart container or normal container
      const children = proj.children.filter(c => c.frameworkVersionAtLeast('v3') && c.typeIs('isomorphic-lib') && c.npmPackages.useSmartInstall);
      for (let index = 0; index < children.length; index++) {
        const c = children[index];
        Helpers.info(`Recreating node_module for ${c.genericName}`)
        c.node_modules.remove();
        c.smartNodeModules.remove();
        await c.filesStructure.init('');
      }
    }
  } else if (proj.isStandaloneProject && proj.npmPackages.useSmartInstall) {
    proj.node_modules.remove();
    proj.smartNodeModules.remove();
    proj.run(`${config.frameworkName} install`).sync();
    Helpers.info(`Reinstal done for core standalone project`);
  } else {
    Helpers.error(`[${config.frameworkName}] This project does not support reinsall.
    location: ${proj?.location}
    `, false, false);
  }

  process.exit(0);
};

//#endregion

//#region deps
export async function $DEPS_SET_CATEGORY(args: string, exit = true) {
  let argumn: string[] = (args.trim() === '' ? [] : args.split(' ')) as any;
  process.chdir((Project.Tnp).location);
  const packages = resolvePacakgesFromArgs(argumn);
  for (let index = 0; index < packages.length; index++) {
    const pkg = packages[index];
    await (Project.Tnp).packageJson.setCategoryFor(pkg);
  }
  if (exit) {
    process.exit(0);
  }
}

export async function $DEPS_UPDATE_FROM(args: string, exit = true) {
  let locations: string[] = (args.trim() === '' ? [] : args.split(' ')) as any;

  if (_.isArray(locations)) {
    locations = locations
      .map(l => {
        if (path.isAbsolute(l)) {
          return path.resolve(l);
        }
        return path.resolve(path.join(process.cwd(), l));
      });
  }
  Project.Current.packageJson.updateFrom(locations);

  if (exit) {
    process.exit(0);
  }
}

function DEPS_SHOW_IF_STANDALONE(args: string) {
  Helpers.log(`Hook update start`)
  const proj = Project.Current;
  if (proj.isStandaloneProject) {
    Helpers.info(`Showing deps for standalone project`);
    proj.packageJson.save('is standalone show')
  }
  Helpers.git.commitWhatIs(proj.location, `show package.json dependencies`)
  Helpers.log(`Hook update ended`)
  process.exit(0)
}

function $DEPS_CLEAN(args: string) {
  DEPS_HIDE(args)
}


export async function $RESET_NPM(args: string, exit = true) {
  await Project.Current.packageJson.reset();
  if (exit) {
    process.exit(0);
  }
}


function DEPS_SHOW(args: string) {
  Project.Current.packageJson.showDeps('deps show')
  process.exit(0)
}

const SHOW_DEPS = (args) => DEPS_SHOW(args);
const SHOW = (args) => {
  DEPS_SHOW(args);
  $VSCODE_TEMP_SHOW(args);
  Helpers.info('Done')
};

function DEPS_HIDE(args: string) {
  if (Project.Current.isCoreProject) {
    Project.Current.packageJson.showDeps('deps show')
  } else {
    Project.Current.packageJson.hideDeps('deps hide')
  }
  process.exit(0)
}

const HIDE_DEPS = (args) => DEPS_HIDE(args);

const HIDE = (args) => {
  DEPS_HIDE(args);
  $VSCODE_TEMP_HIDE(args);
  Helpers.info('Done')
};



const $DEPS_SET_CAT = (args) => {
  $DEPS_SET_CATEGORY(args);
};

async function $DEPS_FROM(args) {
  await $DEPS_UPDATE_FROM(args)
}

async function $DEPS_COPY_FROM(args) {
  await $DEPS_UPDATE_FROM(args)
}

function $DEPS_RESET(args) {
  $RESET_NPM(args)
}


function $DEDUPE(args: string) {
  Project.Current.node_modules.dedupe(args.trim() === '' ? void 0 : args.split(' '))
  process.exit(0)
}

function $DEDUPE_COUNT(args: string) {
  Project.Current.node_modules.dedupeCount(args.trim() === '' ? void 0 : args.split(' '))
  process.exit(0)
}

function $DEDUPE_CHECK(args: string) {
  Project.Current.node_modules.dedupeCount(args.trim() === '' ? void 0 : args.split(' '))
  process.exit(0)
}

function $DEPS_DEDUPE(args: string) {
  Project.Current.node_modules.dedupe()
  process.exit(0)
}

function $DEPS_RECREATE(args: string) {
  DEPS_SHOW(args)
}


export function $DEPS_JSON() {
  const node_moduels = path.join(process.cwd(), config.folder.node_modules);
  const result = {};
  Helpers
    .foldersFrom(node_moduels)
    .filter(f => path.basename(f) !== '.bin')
    .forEach(f => {
      const packageName = path.basename(f);
      if (packageName.startsWith('@')) {
        const orgName = packageName;
        Helpers.foldersFrom(f).forEach(f2 => {
          try {
            result[`${orgName}/${path.basename(f2)}`] = Helpers.readValueFromJson(path.join(f2, config.file.package_json), 'version', '');
          } catch (error) { }
        });
      } else {
        try {
          result[packageName] = Helpers.readValueFromJson(path.join(f, config.file.package_json), 'version', '');
        } catch (error) { }
      }

    });
  Helpers.writeJson(path.join(process.cwd(), config.file.result_packages_json), result);
  process.exit(0);
}


//#endregion

//#region link / unlink

//#region ln
async function $LN(args: string) {
  const [source, dest] = args.split(' ');
  Helpers.createSymLink(source, dest);
  process.exit(0);
}
//#endregion

//#region global deps
//#region global link

async function $LINK() {
  let project = Project.Current;

  if (project.isStandaloneProject) {
    // if (process.platform !== 'win32') {
    //   await Helpers.isElevated();
    // }
    //#region linking to global/local bin
    let glboalBinFolderPath = path.dirname(Helpers.run(`which ${config.frameworkName}`, { output: false }).sync().toString());
    if (process.platform === 'win32') {
      glboalBinFolderPath = crossPlatformPath(glboalBinFolderPath);
      if (/^\/[a-z]\//.test(glboalBinFolderPath)) {
        glboalBinFolderPath = glboalBinFolderPath.replace(/^\/[a-z]\//, `${glboalBinFolderPath.charAt(1).toUpperCase()}:/`);
      }
    }
    const globalNodeModules = crossPlatformPath(path.join(glboalBinFolderPath,
      (process.platform === 'win32') ? config.folder.node_modules : `../lib/${config.folder.node_modules}`));
    const packageInGlobalNodeModules = crossPlatformPath(path.resolve(path.join(globalNodeModules, project.name)));
    // packageInGlobalNodeModules
    Helpers.removeIfExists(packageInGlobalNodeModules);
    project.linkTo(packageInGlobalNodeModules);

    if (!Helpers.exists(project.path(config.folder.bin).absolute.normal)) {
      Helpers.mkdirp(project.path(config.folder.bin).absolute.normal);
    }

    const pattern = `${project.path(config.folder.bin).absolute.normal}/*`;
    const countLinkInPackageJsonBin = glob
      .sync(pattern)
      .map(f => crossPlatformPath(f))
      .filter(f => {
        return (Helpers.readFile(f) || '').startsWith('#!/usr/bin/env');
      });

    if (countLinkInPackageJsonBin.length === 0) {
      const pathNormalLink = Helpers.path.create(project.location, config.folder.bin, `${project.name}`);
      Helpers.writeFile(pathNormalLink, templateBin());
      countLinkInPackageJsonBin.push(pathNormalLink);

      const pathDebugLink = Helpers.path.create(project.location, config.folder.bin, `${project.name}-debug`);
      Helpers.writeFile(pathDebugLink, templateBin(true));
      countLinkInPackageJsonBin.push(pathDebugLink);

      const startBackendFile = Helpers.path.create(
        project.location,
        config.folder.src,
        config.file.start_backend_ts
      );
      if (!Helpers.exists(startBackendFile)) {
        Helpers.writeFile(startBackendFile, templateStartBackedn());
      }

    }

    project.packageJson.data.bin = {};
    countLinkInPackageJsonBin.forEach(p => {
      project.packageJson.data.bin[path.basename(p)] = `bin/${path.basename(p)}`;
    });
    project.packageJson.save(`update bin data`);

    if (_.isObject(project.packageJson.data.bin)) {
      Object.keys(project.packageJson.data.bin).forEach(globalName => {
        const localPath = path.join(project.location, project.packageJson.data.bin[globalName]);
        const destinationGlobalLink = path.join(glboalBinFolderPath, globalName);
        Helpers.removeIfExists(destinationGlobalLink);

        const inspect = globalName.endsWith('debug') || globalName.endsWith('inspect');
        const inspectBrk = globalName.endsWith('debug-brk') || globalName.endsWith('inspect-brk');
        const attachDebugParam = inspect ? '--inspect' : (inspectBrk ? '--inspect-brk' : '')

        if (process.platform === 'win32') {
          Helpers.writeFile(destinationGlobalLink, `
#!/bin/sh
basedir=$(dirname "$(echo "$0" | sed -e 's,\\\\,/,g')")

case \`uname\` in
    *CYGWIN*|*MINGW*|*MSYS*) basedir=\`cygpath -w "$basedir"\`;;
esac

if [ -x "$basedir/node" ]; then
  "$basedir/node" ${attachDebugParam} "$basedir/node_modules/${path.basename(project.location)}/bin/${globalName}" "$@"
  ret=$?
else
  node ${attachDebugParam} "$basedir/node_modules/${path.basename(project.location)}/bin/${globalName}" "$@"
  ret=$?
fi
exit $ret
          `.trim() + '\n');


          const destinationGlobalLinkPS1File = path.join(glboalBinFolderPath, `${globalName}.ps1`);
          Helpers.writeFile(destinationGlobalLinkPS1File, `
#!/usr/bin/env pwsh
$basedir=Split-Path $MyInvocation.MyCommand.Definition -Parent

$exe=""
if ($PSVersionTable.PSVersion -lt "6.0" -or $IsWindows) {
  # Fix case when both the Windows and Linux builds of Node
  # are installed in the same directory
  $exe=".exe"
}
$ret=0
if (Test-Path "$basedir/node$exe") {
  & "$basedir/node$exe"  "$basedir/node_modules/${path.basename(project.location)}/bin/${globalName}" $args
  $ret=$LASTEXITCODE
} else {
  & "node$exe"  "$basedir/node_modules/${path.basename(project.location)}/bin/${globalName}" $args
  $ret=$LASTEXITCODE
}
exit $ret
          `.trim() + '\n');
          const destinationGlobalLinkCmdFile = path.join(glboalBinFolderPath, `${globalName}.cmd`);
          Helpers.writeFile(destinationGlobalLinkCmdFile, `
@ECHO off
SETLOCAL
CALL :find_dp0

IF EXIST "%dp0%\\node.exe" (
  SET "_prog=%dp0%\\node.exe"
) ELSE (
  SET "_prog=node"
  SET PATHEXT=%PATHEXT:;.JS;=;%
)

"%_prog%"  "%dp0%\\node_modules\\${path.basename(project.location)}\\bin\\${globalName}" %*
ENDLOCAL
EXIT /b %errorlevel%
:find_dp0
SET dp0=%~dp0
EXIT /b

          `.trim() + '\n');

        } else {
          Helpers.createSymLink(localPath, destinationGlobalLink);
          const command = `chmod +x ${destinationGlobalLink}`;
          Helpers.log(`Trying to make file exacutable global command "${chalk.bold(globalName)}".

          command: ${command}
          `)
          Helpers.run(command).sync();
        }

        Helpers.info(`Global link created for: ${chalk.bold(globalName)}`);
      });
    }

    process.exit(0);
    //#endregion
  } else if (project.isContainer) { // TODO
    // const childrens = project.children.filter(p => p.frameworkVersionAtLeast('v2'));
    // Helpers.info(`Installing pacakge / Removing own pacakge..`);
    // for (let index = 0; index < childrens.length; index++) {
    //   const c = childrens[index];
    //   Helpers.log(`Processing ${c.genericName}`);
    //   if (!c.node_modules.exist) {
    //     c.npmPackages.installFromArgs('');
    //   }
    //   const ownPackage = c.path(`${config.folder.node_modules}/${c.name}`).absolute.normal;
    //   Helpers.removeIfExists(ownPackage);
    // }
    // Helpers.info(`Removing own pacakge..done`);
    // Helpers.info(`Linking pacakges...`);
    // for (let index = 0; index < childrens.length; index++) {
    //   const c = childrens[index];
    //   const childGenericName = c.genericName;
    //   const copyToChildrens = childrens.filter(ic => c.name !== ic.name);
    //   const copyToChildrensNames = copyToChildrens.map(ic => ic.name);
    //   Helpers.log(`Linking ${childGenericName} for every package in container... `);
    //   // @ts-ignore
    //   const opt = await BuildOptions.from(`${config.frameworkName} bd`, c, { copyto: copyToChildrens });
    //   c.copyManager.init(opt);
    //   await c.copyManager.startAndWatch() // TODO not sure why would I do this
    //   Helpers.log(`Linking ${childGenericName} for every package in container... DONE`);
    // }
    // Helpers.info(`Linking pacakges...DONE`);
    // process.exit(0)
  }
  Helpers.info(`Linking DONE!`)
  process.exit(0)
}

function templateBin(debug = false) {
  return `#!/usr/bin/env node ${debug ? '--inspect' : ''}
var { fse, crossPlatformPath, path } = require('tnp-core/src');
var path = {
  dist: path.join(crossPlatformPath(__dirname), '../dist/index.js'),
  npm: path.join(crossPlatformPath(__dirname), '../index.js')
}
var p = fse.existsSync(path.dist) ? path.dist : path.npm;
global.globalSystemToolMode = true;
var run = require(p).run;
run(process.argv.slice(2));
  `
}

function templateStartBackedn() {
  return `import { Helpers } from 'tnp-helpers/src';

export async function run(args: string[]) {
  console.log('Hello from', require('path').basename(process.argv[1]))
  const command = args.shift() as any;
  if (command === 'test') {
    Helpers.clearConsole();
    console.log('waiting for nothing...')
    process.stdin.resume();
  }
  process.exit(0);
  }`
}
//#endregion

//#endregion

//#endregion

//#region copyto

const $copytoproject = (args) => {
  copyToHandleArgs(args)
}
const $copy_to_project = (args) => {
  copyToHandleArgs(args)
}
const $copyto = (args) => {
  copyToHandleArgs(args)
}
const $copymoduletoproject = async (args) => {
  await copyModuleto(args)
}

const $copy_module_to_project = async (args) => {
  await copyModuleto(args)
}
//#endregion

//#region db


function $SHOW_CORE_MODULES() {
  const container = Project.by('container', 'v1');
  const il = Project.by('isomorphic-lib', 'v1');

  const containerv2 = Project.by('container', 'v2');
  const ilv2 = Project.by('isomorphic-lib', 'v2');
  console.log(`
v1 Container core:\t    ${container.location}
v1 Isomorphic-lib core:\t  ${il.location}

v2 Container core:\t    ${containerv2.location}
v2 Isomorphic-lib core:\t  ${ilv2.location}
  `)

  process.exit(0);
}
//#endregion


function $GIT_SHOW_REMOTES() {
  const folders = Helpers.foldersFrom(process.cwd());

  folders
    .filter(c => !path.basename(c).startsWith('.'))
    .forEach(cwd => {
      Helpers.run(`git config --get remote.origin.url`, { cwd }).sync()
    });
  process.exit(0)
}


export default {
  SMART_REINSTALL: Helpers.CLIWRAP(SMART_REINSTALL, 'SMART_REINSTALL'),
  $GIT_SHOW_REMOTES: Helpers.CLIWRAP($GIT_SHOW_REMOTES, '$GIT_SHOW_REMOTES'),

  $DEPS_SET_CATEGORY: Helpers.CLIWRAP($DEPS_SET_CATEGORY, '$DEPS_SET_CATEGORY'),
  $DEPS_SET_CAT: Helpers.CLIWRAP($DEPS_SET_CAT, '$DEPS_SET_CAT'),
  $DEPS_UPDATE_FROM: Helpers.CLIWRAP($DEPS_UPDATE_FROM, '$DEPS_UPDATE_FROM'),
  $DEPS_COPY_FROM: Helpers.CLIWRAP($DEPS_COPY_FROM, '$DEPS_COPY_FROM'),
  $DEPS_FROM: Helpers.CLIWRAP($DEPS_FROM, '$DEPS_FROM'),
  DEPS_SHOW: Helpers.CLIWRAP(DEPS_SHOW, 'DEPS_SHOW'),
  SHOW_DEPS: Helpers.CLIWRAP(SHOW_DEPS, 'SHOW_DEPS'),
  $DEPS_RESET: Helpers.CLIWRAP($DEPS_RESET, '$DEPS_RESET'),
  DEPS_SHOW_IF_STANDALONE: Helpers.CLIWRAP(DEPS_SHOW_IF_STANDALONE, 'DEPS_SHOW_IF_STANDALONE'),
  DEPS_HIDE: Helpers.CLIWRAP(DEPS_HIDE, 'DEPS_HIDE'),
  $DEPS_JSON: Helpers.CLIWRAP($DEPS_JSON, '$DEPS_JSON'),
  HIDE_DEPS: Helpers.CLIWRAP(HIDE_DEPS, 'HIDE_DEPS'),
  $DEPS_CLEAN: Helpers.CLIWRAP($DEPS_CLEAN, '$DEPS_CLEAN'),

  $RESET_NPM: Helpers.CLIWRAP($RESET_NPM, '$RESET_NPM'),

  $DEDUPE: Helpers.CLIWRAP($DEDUPE, '$DEDUPE'),
  $DEDUPE_COUNT: Helpers.CLIWRAP($DEDUPE_COUNT, '$DEDUPE_COUNT'),
  $DEDUPE_CHECK: Helpers.CLIWRAP($DEDUPE_CHECK, '$DEDUPE_CHECK'),
  $DEPS_DEDUPE: Helpers.CLIWRAP($DEPS_DEDUPE, '$DEPS_DEDUPE'),


  SHOW: Helpers.CLIWRAP(SHOW, 'SHOW'),
  HIDE: Helpers.CLIWRAP(HIDE, 'HIDE'),


  $DEPS_RECREATE: Helpers.CLIWRAP($DEPS_RECREATE, '$DEPS_RECREATE'),
  $SHOW_CORE_MODULES: Helpers.CLIWRAP($SHOW_CORE_MODULES, '$SHOW_CORE_MODULES'),

  $INSTALL: Helpers.CLIWRAP($INSTALL, '$INSTALL'),
  $UNINSTALL: Helpers.CLIWRAP($UNINSTALL, 'UNINSTALL'),
  $I: Helpers.CLIWRAP($I, '$I'),
  $SINSTALL: Helpers.CLIWRAP($SINSTALL, '$SINSTALL'),
  $REINSTALL: Helpers.CLIWRAP($REINSTALL, '$REINSTALL'),

  $LINK: Helpers.CLIWRAP($LINK, '$LINK'),
  $LN: Helpers.CLIWRAP($LN, '$LN'),

  $copytoproject: Helpers.CLIWRAP($copytoproject, '$copytoproject'),
  $copy_to_project: Helpers.CLIWRAP($copy_to_project, '$copy_to_project'),
  $copyto: Helpers.CLIWRAP($copyto, '$copyto'),
  $copymoduletoproject: Helpers.CLIWRAP($copymoduletoproject, '$copymoduletoproject'),
  $copy_module_to_project: Helpers.CLIWRAP($copy_module_to_project, '$copy_module_to_project'),
}
