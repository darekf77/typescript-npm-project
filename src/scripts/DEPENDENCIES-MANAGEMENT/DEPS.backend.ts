import * as _ from 'lodash';
import * as path from 'path';
import * as fse from 'fs-extra';
import chalk from 'chalk';
import { Project } from '../../project/abstract/project';
import { Helpers } from '../../helpers';
import { config } from '../../config';
import { TnpDB } from '../../tnp-db/wrapper-db';
import { resolvePacakgesFromArgs } from '../../project/features/npm-packages/npm-packages-helpers.backend';


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


function copyToDestination(destLocaiton) {

  const currentLib = Project.Current;
  const destination = Project.From(destLocaiton);
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
  await Project.Current.npmPackages.installFromArgs(args, smooth);
  if (exit) {
    process.exit(0);
  }
}

export async function $UNINSTALL(args, exit = true) {
  await Project.Current.npmPackages.uninstallFromArgs(args);
  if (exit) {
    process.exit(0);
  }
}

export async function $DEPS_SET_CATEGORY(args: string, exit = true) {
  let argumn: string[] = (args.trim() === '' ? [] : args.split(' ')) as any;
  process.chdir(Project.Tnp.location);
  const packages = resolvePacakgesFromArgs(argumn);
  for (let index = 0; index < packages.length; index++) {
    const pkg = packages[index];
    await Project.Tnp.packageJson.setCategoryFor(pkg);
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

export async function $RESET_NPM(args: string, exit = true) {
  await Project.Current.packageJson.reset();
  if (exit) {
    process.exit(0);
  }
}

export async function $RESET_NPM_ALL(args: string, exit = true) {
  const db = await TnpDB.Instance;
  const projects = db.getProjects();
  for (let index = 0; index < projects.length; index++) {
    const project = projects[index];
    // console.log(project.project.genericName)
    project.project.packageJson.reset();
  }
  if (exit) {
    process.exit(0);
  }
}


function DEPS_SHOW(args: string) {
  Project.Current.packageJson.showDeps('deps show')
  process.exit(0)
}

function DEPS_HIDE(args: string) {
  if (Project.Current.isCoreProject) {
    Project.Current.packageJson.showDeps('deps show')
  } else {
    Project.Current.packageJson.hideDeps('deps hide')
  }
  process.exit(0)
}

function $INSTALL_IN_TNP() {
  const inTnp = path.join(Project.Tnp.location, config.folder.node_modules, Project.Current.name);
  const inCurrent = path.join(Project.Current.location, config.folder.dist);
  if (!fse.existsSync(inCurrent)) {
    Helpers.error(`Please build dist version of project first with tsc: tsc`, false, true);
  }
  Helpers.tryRemoveDir(inTnp);
  Helpers.tryCopyFrom(inCurrent, inTnp);
  Helpers.info(`Current project "${Project.Current.genericName}" installed in node_moduels of tnp`);
  process.exit(0)
}

export default {
  $INSTALL_IN_TNP,
  $I_IN_TNP() {
    $INSTALL_IN_TNP()
  },
  $DEPS_SET_CATEGORY,
  $DEPS_SET_CAT(args) {
    $DEPS_SET_CATEGORY(args);
  },
  $DEPS_UPDATE_FROM,
  async $DEPS_FROM(args) {
    await $DEPS_UPDATE_FROM(args)
  },
  $RESET_NPM,
  $RESET_NPM_ALL,
  $DEPS_RESET(args) {
    $RESET_NPM(args)
  },
  $DEPS_RESET_ALL(args) {
    $RESET_NPM_ALL(args)
  },
  $DEDUPE(args: string) {
    Project.Current.node_modules.dedupe(args.trim() === '' ? void 0 : args.split(' '))
    process.exit(0)
  },

  $DEDUPE_COUNT(args: string) {
    Project.Current.node_modules.dedupeCount(args.trim() === '' ? void 0 : args.split(' '))
    process.exit(0)
  },

  $DEDUPE_CHECK(args: string) {
    Project.Current.node_modules.dedupeCount(args.trim() === '' ? void 0 : args.split(' '))
    process.exit(0)
  },

  $DEPS_DEDUPE(args: string) {
    Project.Current.node_modules.dedupe()
    process.exit(0)
  },

  DEPS_SHOW,
  $DEPS_RECREATE(args: string) {
    DEPS_SHOW(args)
  },

  $SHOW_CHILDREN() {
    console.log(Project.Current.children.map(c => c.genericName).join('\n'))
    process.exit(0)
  },

  DEPS_SHOW_IF_STANDALONE(args: string) {
    Helpers.log(`Hook update start`)
    if (Project.Current.isStandaloneProject) {
      Helpers.info(`Showing deps for standalone project`)
      Project.Current.packageJson.save('is standalone show')
    }
    Helpers.git.commitWhatIs(`show package.json dependencies`)
    Helpers.log(`Hook update ended`)
    process.exit(0)
  },

  DEPS_HIDE,
  $DEPS_CLEAN(args: string) {
    DEPS_HIDE(args)
  },
  $INSTALL,
  UNINSTALL: $UNINSTALL,
  $I: (args) => {
    $INSTALL(args);
  },
  $SINSTALL: (args) => {
    $INSTALL(args, true);
  },
  async  $LINK() {
    let project = Project.Current;
    if (project.isWorkspaceChildProject) {
      project = project.parent;
    }
    if (!project.isWorkspace) {
      Helpers.error(`This is not workspace or workpace child projct`, false, true)
    }
    project.workspaceSymlinks.add(`Add workspace symlinks`);
    process.exit(0)
  },
  async  $UNLINK() {
    let project = Project.Current;
    if (project.isWorkspaceChildProject) {
      project = project.parent;
    }
    if (!project.isWorkspace) {
      Helpers.error(`This is not workspace or workpace child projct`, false, true)
    }
    project.workspaceSymlinks.remove(`Remove workspace symlinks`);
    process.exit(0)
  },

  $copytoproject: (args) => {
    copyToHandleArgs(args)
  },
  $copy_to_project: (args) => {
    copyToHandleArgs(args)
  },
  $copyto: (args) => {
    copyToHandleArgs(args)
  },
  $copymoduletoproject: async (args) => {
    await copyModuleto(args)
  },
  $copy_module_to_project: async (args) => {
    await copyModuleto(args)
  },

}
