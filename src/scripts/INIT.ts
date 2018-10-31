//#region @backend
import { Project } from "../project";
import { run } from '../process';
import { error } from '../messages';
import chalk from 'chalk';
import { install } from './INSTALL';

async function initialize(
  pArgs?: string,
  project = Project.Current, watch = false) {

  if (project.isWorkspaceChildProject) {
    project.parent.tnpHelper.install()
  } else if (project.isWorkspace) {
    project.tnpHelper.install()
  }

  if (project.isWorkspaceChildProject && !project.parent.node_modules.exist()) {
    install('', project.parent, false);
  } else if (!project.node_modules.exist()) {
    install('', project, false);
  }

  if (project.parent) {
    project.parent.recreate.init();// TODO QUICK IFX
  }

  project.recreate.init();

  if (project.isSite) {

    if (project.isWorkspaceChildProject) {
      project.parent.baseline.tnpHelper.install()
    } else if (project.isWorkspace) {
      project.baseline.tnpHelper.install()
    }

    if (project.baseline && project.baseline.isWorkspaceChildProject) {
      project.baseline.parent.recreate.init()
    }
    project.baseline.recreate.init();

    if (watch) {
      // console.log("HERE !!")

      project.join.init().watch()

      if (project.isWorkspaceChildProject
        // QUICK_FIX for webpack fails
        // when parent is angular project
        && project.type === 'isomorphic-lib'
      ) {
        project.parent.join.init().watch()
      }
    } else {
      project.join.init()
      if (project.isWorkspaceChildProject) {
        project.parent.join.init()
      }
    }
  }

  // console.log(`Prepare environment for: ${this.name}`)
  if (!project.isStandaloneProject) {

    const initFromScratch = (!project.env.config || (project.isWorkspaceChildProject && !project.parent.env.config));

    await project.env.init(pArgs, !initFromScratch);

    if (!initFromScratch) {
      console.log(`Config alredy ${chalk.bold('init')}ed tnp.
${chalk.green('Environment for')} ${chalk.green(chalk.bold(project.name))}: ${chalk.bold(project.env.config.name)}`)
    }

  }

}

export function init(args: string,
  options?: { watch: boolean }) {

  if (!options) {
    options = { watch: false };
  }

  const { watch } = options;

  return {
    get watch() {
      return init(args, { watch: true })
    },
    async project(p: Project = Project.Current) {
      await initialize(args, p, watch)
    }
  }

}

// init().project();
// init().watch.project()

export default {
  $INIT: async (args) => {
    await init(args).project()
    process.exit(0)
  },

  $INIT_WATCH: async (args) => {
    await init(args).watch.project()
  },

  $VSCODE: () => {
    Project.Current.recreate.vscode.settings.excludedFiles();
    Project.Current.recreate.vscode.settings.colorsFromWorkspace()
    process.exit(0)
  },
  $INIT_VSCODE: () => {
    Project.Current.recreate.vscode.settings.excludedFiles();
    Project.Current.recreate.vscode.settings.colorsFromWorkspace()
    process.exit(0)
  },
  $INIT_EVERYWHERE: (args) => {
    Project.projects.forEach(p => {
      p.run(`tnp init`).sync()
    })
  }
}
//#endregion
