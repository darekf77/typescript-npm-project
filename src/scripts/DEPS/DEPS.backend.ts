import * as _ from 'lodash';
import * as path from 'path';
import { Project } from '../../project/abstract/project';
import { commitWhatIs } from '../../helpers/helpers-git';
import { info, log } from '../../helpers/helpers-messages';
import { TnpDB } from '../../tnp-db/wrapper-db';
import { resolvePacakgesFromArgs } from '../../project/features/npm-packages/npm-packages-helpers.backend';

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
  Project.Current.packageJson.hideDeps('deps hide')
  process.exit(0)
}


export default {
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

  $DEPS_DEDUPE(args: string) {
    Project.Current.node_modules.dedupe()
    process.exit(0)
  },

  DEPS_SHOW,
  $DEPS_RECREATE(args: string) {
    DEPS_SHOW(args)
  },

  DEPS_SHOW_IF_STANDALONE(args: string) {
    log(`Hook update start`)
    if (Project.Current.isStandaloneProject) {
      info(`Showing deps for standalone project`)
      Project.Current.packageJson.save('is standalone show')
    }
    commitWhatIs(`show package.json dependencies`)
    log(`Hook update ended`)
    process.exit(0)
  },

  DEPS_HIDE,
  $DEPS_CLEAN(args: string) {
    DEPS_HIDE(args)
  },
}
