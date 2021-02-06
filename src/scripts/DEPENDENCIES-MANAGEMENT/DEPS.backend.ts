import * as _ from 'lodash';
import * as path from 'path';
import * as fse from 'fs-extra';
import * as open from 'open';
import * as glob from 'glob';
import chalk from 'chalk';
import { Project } from '../../project/abstract/project';
import { Helpers } from 'tnp-helpers';
import { config } from 'tnp-config';
import { TnpDB, DbDaemonController, BuildOptions } from 'tnp-db';
import { resolvePacakgesFromArgs } from '../../project/features/npm-packages/npm-packages-helpers.backend';
import { Morphi } from 'morphi';

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


function copyToDestination(destLocaiton) {

  const currentLib = (Project.Current as Project);
  const destination = Project.From<Project>(destLocaiton);
  if (!destination) {
    Helpers.error(`Incorect project in: ${destLocaiton}`)
  }
  currentLib.copyManager.copyBuildedDistributionTo(destination, void 0, false);
  Helpers.info(`Project "${chalk.bold(currentLib.name)}" successfully installed in "${destination.name}"`);
}

function copyToHandleArgs(args: string) {

  const destLocaitons = args.split(' ').filter(a => a.trim() !== '');

  destLocaitons.forEach(c => copyToDestination(c));


  process.exit(0)
}

export async function $INSTALL(args, smooth = false, exit = true) {
  // console.log('instalaltion')
  await (Project.Current as Project).npmPackages.installFromArgs(args, smooth);
  // console.log('instalaltion after')
  if (exit) {
    process.exit(0);
  }
}

export async function $UNINSTALL(args, exit = true) {
  await (Project.Current as Project).npmPackages.uninstallFromArgs(args);
  if (exit) {
    process.exit(0);
  }
}

export async function $DEPS_SET_CATEGORY(args: string, exit = true) {
  let argumn: string[] = (args.trim() === '' ? [] : args.split(' ')) as any;
  process.chdir((Project.Tnp as Project).location);
  const packages = resolvePacakgesFromArgs(argumn);
  for (let index = 0; index < packages.length; index++) {
    const pkg = packages[index];
    await (Project.Tnp as Project).packageJson.setCategoryFor(pkg);
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
  (Project.Current as Project).packageJson.updateFrom(locations);

  if (exit) {
    process.exit(0);
  }
}

export async function $RESET_NPM(args: string, exit = true) {
  await (Project.Current as Project).packageJson.reset();
  if (exit) {
    process.exit(0);
  }
}

export async function $RESET_NPM_ALL(args: string, exit = true) {
  const db = await TnpDB.Instance();
  const projects = await db.getProjects();
  for (let index = 0; index < projects.length; index++) {
    const project = projects[index];
    // console.log(project.project.genericName)
    (project.project as Project).packageJson.reset();
  }
  if (exit) {
    process.exit(0);
  }
}


function DEPS_SHOW(args: string) {
  (Project.Current as Project).packageJson.showDeps('deps show')
  process.exit(0)
}

function DEPS_HIDE(args: string) {
  if ((Project.Current as Project).isCoreProject) {
    (Project.Current as Project).packageJson.showDeps('deps show')
  } else {
    (Project.Current as Project).packageJson.hideDeps('deps hide')
  }
  process.exit(0)
}

function $INSTALL_IN_TNP() {
  const inTnp = path.join((Project.Tnp as Project).location, config.folder.node_modules, (Project.Current as Project).name);
  const inCurrent = path.join((Project.Current as Project).location, config.folder.dist);
  if (!fse.existsSync(inCurrent)) {
    Helpers.error(`Please build dist version of project first with tsc: tsc`, false, true);
  }
  Helpers.tryRemoveDir(inTnp);
  Helpers.tryCopyFrom(inCurrent, inTnp);
  Helpers.info(`Current project "${(Project.Current as Project).genericName}" installed in node_moduels of tnp`);
  process.exit(0)
}

const $I_IN_TNP = () => {
  $INSTALL_IN_TNP()
};

const $DEPS_SET_CAT = (args) => {
  $DEPS_SET_CATEGORY(args);
};

async function $DEPS_FROM(args) {
  await $DEPS_UPDATE_FROM(args)
}

function $DEPS_RESET(args) {
  $RESET_NPM(args)
}

function $DEPS_RESET_ALL(args) {
  $RESET_NPM_ALL(args)
}

function $DEDUPE(args: string) {
  (Project.Current as Project).node_modules.dedupe(args.trim() === '' ? void 0 : args.split(' '))
  process.exit(0)
}

function $DEDUPE_COUNT(args: string) {
  (Project.Current as Project).node_modules.dedupeCount(args.trim() === '' ? void 0 : args.split(' '))
  process.exit(0)
}

function $DEDUPE_CHECK(args: string) {
  (Project.Current as Project).node_modules.dedupeCount(args.trim() === '' ? void 0 : args.split(' '))
  process.exit(0)
}

function $DEPS_DEDUPE(args: string) {
  (Project.Current as Project).node_modules.dedupe()
  process.exit(0)
}

function $DEPS_RECREATE(args: string) {
  DEPS_SHOW(args)
}

function $SHOW_CHILDREN() {
  console.log((Project.Current as Project).children.map(c => c.genericName).join('\n'))
  process.exit(0)
}

async function $SHOW_DB() {
  const db = await TnpDB.Instance();
  const port = await db.getWokerPort();
  if (_.isNumber(port)) {
    const addressToShow = Morphi.getHttpPathBy<DbDaemonController>(DbDaemonController, port, 'info');
    await open(addressToShow);
  } else {
    Helpers.run(`code --goto ${config.dbLocation}`).sync(); // TODO it will never happen
  }
  process.exit(0)
}

async function $DB_SHOW() {
  await $SHOW_DB();
}
async function $DB_CODE() {
  const db = await TnpDB.Instance();
  Helpers.run(`code ${db.location}`).sync();
  process.exit(0)
}

async function $CODE_DB() {
  await $DB_CODE();
}


const $OPEN_DB = async () => await $SHOW_DB();
const $DB_OPEN = async () => await $SHOW_DB();

async function $SHOW_WORKER() {
  await $SHOW_DB();
}

async function $SHOW_PROJECTS() {
  const db = await TnpDB.Instance();
  const projects = (await db.getProjects())
  console.log(projects.map(p => p.locationOfProject).join('\n'));
  process.exit(0)
}

async function $SHOW_PROJECTS_NAVI() {
  const db = await TnpDB.Instance();
  const projects = (await db.getProjects())
  console.log(projects.filter(p => p.project.typeIs('navi')).map(p => p.locationOfProject).join('\n'));
  process.exit(0)
}


function $SHOW_CORE_MODULES() {
  const container = Project.by('container', 'v1');
  const workspace = Project.by('workspace', 'v1');
  const al = Project.by('angular-lib', 'v1');
  const il = Project.by('isomorphic-lib', 'v1');

  const containerv2 = Project.by('container', 'v2');
  const workspacev2 = Project.by('workspace', 'v2');
  const alv2 = Project.by('angular-lib', 'v2');
  const ilv2 = Project.by('isomorphic-lib', 'v2');
  console.log(`
v1 Container core:\t    ${container.location}
v1 Workspace core:\t    ${workspace.location}
v1 Angular-lib core:\t  ${al.location}
v1 Isomorphic-lib core:\t  ${il.location}

v2 Container core:\t    ${containerv2.location}
v2 Workspace core:\t    ${workspacev2.location}
v2 Angular-lib core:\t  ${alv2.location}
v2 Isomorphic-lib core:\t  ${ilv2.location}
  `)

  process.exit(0);
}

function DEPS_SHOW_IF_STANDALONE(args: string) {
  Helpers.log(`Hook update start`)
  if ((Project.Current as Project).isStandaloneProject) {
    Helpers.info(`Showing deps for standalone project`);
    (Project.Current as Project).packageJson.save('is standalone show')
  }
  Helpers.git.commitWhatIs(`show package.json dependencies`)
  Helpers.log(`Hook update ended`)
  process.exit(0)
}

function $DEPS_CLEAN(args: string) {
  DEPS_HIDE(args)
}

const $I = (args) => {
  $INSTALL(args);
}

const $REINSTALL = async (args) => {
  const proj = Project.Current as Project;
  await proj.clear();
  await proj.filesStructure.init(args)
  process.exit(0);
};

const $SINSTALL = (args) => {
  $INSTALL(args, true);
}

async function $LINKCORE() {
  Project.linkCoreFolders();
  Helpers.info('Done linking core folders');
  process.exit(0);
}

function templateBin(debug = false) {
  return `#!/usr/bin/env node ${debug ? '--inspect' : ''}
var path = require('path')
var fs = require('fs')
var path = {
  dist: path.join(__dirname, '../dist/start.backend.js'),
  bundle: path.join(__dirname, '../start.backend.js')
}
var p = fs.existsSync(path.dist) ? path.dist : path.bundle;
global.globalSystemToolMode = true;
var run = require(p).run;
run(process.argv.slice(2));
  `
}

function templateStartBackedn() {
  return `import { Helpers } from 'tnp-helpers';

export async function run(args: string[]) {
    const command = args.shift() as any;
    if (command === 'test') {
      Helpers.clearConsole();
    }
    process.stdin.resume();
  }`
}


async function $LINK() {
  let project = (Project.Current as Project);

  if (project.isStandaloneProject) {
    const glboalBinFolderPath = path.dirname(Helpers.run(`which ${config.frameworkName}`, { output: false }).sync().toString());
    const globalNodeModules = path.join(glboalBinFolderPath, '../lib/node_modules');
    const packageInGlobalNodeModules = path.resolve(path.join(globalNodeModules, project.name));
    // packageInGlobalNodeModules
    Helpers.removeIfExists(packageInGlobalNodeModules);
    project.linkTo(packageInGlobalNodeModules);

    if (!Helpers.exists(project.path(config.folder.bin).absolute.normal)) {
      Helpers.mkdirp(project.path(config.folder.bin).absolute.normal);
    }

    const pattern = `${project.path(config.folder.bin).absolute.normal}/*`;
    const countLinkInPackageJsonBin = glob
      .sync(pattern)
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
        Helpers.createSymLink(localPath, destinationGlobalLink);
        const command = `sudo chmod +x ${destinationGlobalLink}`;
        Helpers.info(`Trying to make file exacutable global command "${chalk.bold(globalName)}".

        command: ${command}

        Please enter your admin password:

        `)
        Helpers.run(command).sync();
        Helpers.info(`Global link created for: ${chalk.bold(globalName)}`);
      });
    }

    process.exit(0);
  } else {
    if (project.isWorkspaceChildProject) {
      project = project.parent;
    }
    if (!project.isWorkspace) {
      Helpers.error(`This is not workspace or workpace child projct`, false, true)
    }
    project.workspaceSymlinks.add(`Add workspace symlinks`);
  }
  Helpers.info(`Linking DONE!`)
  process.exit(0)
}

async function $UNLINK() {
  let project = (Project.Current as Project);
  if (project.isWorkspaceChildProject) {
    project = project.parent;
  }
  if (!project.isWorkspace) {
    Helpers.error(`This is not workspace or workpace child projct`, false, true)
  }
  project.workspaceSymlinks.remove(`Remove workspace symlinks`);
  process.exit(0)
}

async function ACTION_COPYTO(action: 'add' | 'remove', args) {
  const proj = Helpers.cliTool.resolveProject<Project>(args, Project.Current, Project as any);
  if (proj) {
    Helpers.info(`[copyto] ${action.toUpperCase()} project: ${proj.name}`);
    const db = await TnpDB.Instance();
    Helpers.log(`instance ok`);
    const cmd = (await db.getCommands()).find(c => c.isBuildCommand && c.location === Project.Current.location);
    if (cmd) {
      try {
        var b = await BuildOptions.from(cmd.command, Project.Current);
      } catch (error) {
        console.log(error);
      }
      if (action === 'add') {
        (b.copyto as Project[]).push(proj)
      }
      if (action === 'remove') {
        (b.copyto as Project[]) = (b.copyto as Project[]).filter(p => p !== proj);
      }
      Helpers.info(`Updating command`);
      await db.updateCommandBuildOptions(Project.Current.location, b);
      Helpers.info(`Build option update done.. ${action}ed ${chalk.bold(proj.genericName)}`);
      await db.triggerChangeForProject(Project.Current, `tnp-copyto-${action}` as any);
    } else {
      Helpers.warn(`No command to update`)
    }
  }
  Helpers.info(`DONE`);
  process.exit(0);
}

async function $COPY_TO_REMOVE(args) {
  await ACTION_COPYTO('remove', args);
}

async function $COPY_TO_ADD(args) {
  await ACTION_COPYTO('add', args);
}

async function $COPY_TO_LIST(args) {

}


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

async function $DEPS_TREE() {
  const proj = (Project.Current as Project);
  if (proj.isWorkspaceChildProject) {
    const c = proj;
    Helpers.info(`child: ${c.name}`);
    const libs = c.libsForTraget(c);
    if (libs.length === 0) {
      Helpers.log(`-- no deps --`);
    } else {
      libs.forEach(d => {
        Helpers.log(`dep ${d.name}`);
      })
    }
  } else if (proj.isWorkspace) {
    proj.children.forEach(c => {
      Helpers.info(`child: ${c.name}`);
      const libs = c.libsForTraget(c);
      if (libs.length === 0) {
        Helpers.log(`-- no deps --`);
      } else {
        libs.forEach(d => {
          Helpers.log(`dep ${d.name}`);
        })
      }

    });
  }

  process.exit(0)

}

async function $DEPS_TREE2() {
  const proj = (Project.Current as Project);
  proj.children.forEach(c => {
    Helpers.info(`child: ${c.name}`);
    if (c.workspaceDependencies.length === 0) {
      Helpers.log(`-- no deps --`);
    } else {
      c.workspaceDependencies.forEach(d => {
        Helpers.log(`dep ${d.name}`);
      })
    }

  });
  process.exit(0)

}

export default {
  $DEPS_TREE2: Helpers.CLIWRAP($DEPS_TREE2, '$DEPS_TREE2'),
  $DEPS_TREE: Helpers.CLIWRAP($DEPS_TREE, '$DEPS_TREE'),
  $INSTALL_IN_TNP: Helpers.CLIWRAP($INSTALL_IN_TNP, '$INSTALL_IN_TNP'),
  $I_IN_TNP: Helpers.CLIWRAP($I_IN_TNP, '$I_IN_TNP'),
  $DEPS_SET_CATEGORY: Helpers.CLIWRAP($DEPS_SET_CATEGORY, '$DEPS_SET_CATEGORY'),
  $DEPS_SET_CAT: Helpers.CLIWRAP($DEPS_SET_CAT, '$DEPS_SET_CAT'),
  $DEPS_UPDATE_FROM: Helpers.CLIWRAP($DEPS_UPDATE_FROM, '$DEPS_UPDATE_FROM'),
  $DEPS_FROM: Helpers.CLIWRAP($DEPS_FROM, '$DEPS_FROM'),
  $RESET_NPM: Helpers.CLIWRAP($RESET_NPM, '$RESET_NPM'),
  $RESET_NPM_ALL: Helpers.CLIWRAP($RESET_NPM_ALL, '$RESET_NPM_ALL'),
  $DEPS_RESET: Helpers.CLIWRAP($DEPS_RESET, '$DEPS_RESET'),
  $DEPS_RESET_ALL: Helpers.CLIWRAP($DEPS_RESET_ALL, '$DEPS_RESET_ALL'),
  $DEDUPE: Helpers.CLIWRAP($DEDUPE, '$DEDUPE'),
  $DEDUPE_COUNT: Helpers.CLIWRAP($DEDUPE_COUNT, '$DEDUPE_COUNT'),
  $DEDUPE_CHECK: Helpers.CLIWRAP($DEDUPE_CHECK, '$DEDUPE_CHECK'),
  $DEPS_DEDUPE: Helpers.CLIWRAP($DEPS_DEDUPE, '$DEPS_DEDUPE'),
  DEPS_SHOW: Helpers.CLIWRAP(DEPS_SHOW, 'DEPS_SHOW'),
  $DEPS_RECREATE: Helpers.CLIWRAP($DEPS_RECREATE, '$DEPS_RECREATE'),
  $SHOW_PROJECTS: Helpers.CLIWRAP($SHOW_PROJECTS, '$SHOW_PROJECTS'),
  $SHOW_PROJECTS_NAVI: Helpers.CLIWRAP($SHOW_PROJECTS_NAVI, '$SHOW_PROJECTS_NAVI'),
  $DB_CODE: Helpers.CLIWRAP($DB_CODE, '$DB_CODE'),
  $CODE_DB: Helpers.CLIWRAP($CODE_DB, '$CODE_DB'),
  $SHOW_DB: Helpers.CLIWRAP($SHOW_DB, '$SHOW_DB'),
  $DB_SHOW: Helpers.CLIWRAP($DB_SHOW, '$DB_SHOW'),
  $OPEN_DB: Helpers.CLIWRAP($OPEN_DB, '$OPEN_DB'),
  $DB_OPEN: Helpers.CLIWRAP($DB_OPEN, '$DB_OPEN'),
  $SHOW_WORKER: Helpers.CLIWRAP($SHOW_WORKER, '$SHOW_WORKER'),
  $SHOW_CHILDREN: Helpers.CLIWRAP($SHOW_CHILDREN, '$SHOW_CHILDREN'),
  $SHOW_CORE_MODULES: Helpers.CLIWRAP($SHOW_CORE_MODULES, '$SHOW_CORE_MODULES'),
  DEPS_SHOW_IF_STANDALONE: Helpers.CLIWRAP(DEPS_SHOW_IF_STANDALONE, 'DEPS_SHOW_IF_STANDALONE'),
  DEPS_HIDE: Helpers.CLIWRAP(DEPS_HIDE, 'DEPS_HIDE'),
  $DEPS_CLEAN: Helpers.CLIWRAP($DEPS_CLEAN, '$DEPS_CLEAN'),
  $INSTALL: Helpers.CLIWRAP($INSTALL, '$INSTALL'),
  $UNINSTALL: Helpers.CLIWRAP($UNINSTALL, 'UNINSTALL'),
  $I: Helpers.CLIWRAP($I, '$I'),
  $SINSTALL: Helpers.CLIWRAP($SINSTALL, '$SINSTALL'),
  $REINSTALL: Helpers.CLIWRAP($REINSTALL, '$REINSTALL'),
  $LINKCORE: Helpers.CLIWRAP($LINKCORE, '$LINKCORE'),
  $LINK: Helpers.CLIWRAP($LINK, '$LINK'),
  $UNLINK: Helpers.CLIWRAP($UNLINK, '$UNLINK'),
  $copytoproject: Helpers.CLIWRAP($copytoproject, '$copytoproject'),
  $copy_to_project: Helpers.CLIWRAP($copy_to_project, '$copy_to_project'),
  $copyto: Helpers.CLIWRAP($copyto, '$copyto'),
  $COPY_TO_LIST: Helpers.CLIWRAP($COPY_TO_LIST, '$COPY_TO_LIST'),
  $COPY_TO_ADD: Helpers.CLIWRAP($COPY_TO_ADD, '$COPY_TO_ADD'),
  $COPY_TO_REMOVE: Helpers.CLIWRAP($COPY_TO_REMOVE, '$COPY_TO_REMOVE'),
  $copymoduletoproject: Helpers.CLIWRAP($copymoduletoproject, '$copymoduletoproject'),
  $copy_module_to_project: Helpers.CLIWRAP($copy_module_to_project, '$copy_module_to_project'),
}
