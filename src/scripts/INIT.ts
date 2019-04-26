//#region @backend
import { Project } from "../project";
import { run } from '../helpers';
import { error } from '../helpers';
import chalk from 'chalk';
import { RecrusiveBaseline } from './INIT-recrusive-functions';
import { TnpDB } from '../tnp-db';
import { sleep } from 'sleep';


async function initialize(
  pArgs?: string,
  project = Project.Current, watch = false) {

  if (!project) {
    console.log(`No project to init inside: ${process.cwd()}`, false, true)
  }

  project.tnpHelper.install()

  if (project.isWorkspaceChildProject && !project.parent.node_modules.exist()) {
    project.parent.npmPackages.installAll();
  } else if (!project.node_modules.exist()) {
    project.npmPackages.installAll();
  }

  if (project.parent) {
    project.parent.recreate.init();// TODO QUICK IFX
  }

  project.recreate.init();

  if (project.isSite) {

    await RecrusiveBaseline.installTnpHelpersForBaselines(project.baseline);
    await RecrusiveBaseline.recreateFilesBaselinesWorkspaces(project);
    project.baseline.recreate.init();

    await RecrusiveBaseline.joinSiteWithParentBaselines(project, watch);
  }

  if (!project.isStandaloneProject) {

    const initFromScratch = (!project.env.config || (project.isWorkspaceChildProject && !project.parent.env.config));

    await project.env.init(pArgs, !initFromScratch);

    if (!initFromScratch) {
      const projectName = project.parent ? `${project.parent.name}/${project.name}` : project.name

      console.log(`Config alredy ${chalk.bold('init')}ed tnp.
${chalk.green('Environment for')} ${project.isGenerated ? chalk.bold('(generated)') : ''} ${chalk.green(chalk.bold(projectName))}: ${chalk.bold(project.env.config.name)}`)
    }

  }

}

export function initFromArgs(args: string,
  options?: { watch: boolean }) {

  if (!options) {
    options = { watch: false };
  }

  const { watch } = options;

  return {
    get watch() {
      return initFromArgs(args, { watch: true })
    },
    async project(p: Project = Project.Current) {
      const db = await TnpDB.Instance;
      await db.transaction.addProjectIfNotExist(p)
      await initialize(args, p, watch)

    }
  }

}

// init().project();
// init().watch.project()

export async function INIT(args, exit = true) {
  await initFromArgs(args).project()
  if (exit) {
    process.exit(0)
  }

}


export default {

  INIT,

  $VSCODE_FIX: async () => {
    const db = await TnpDB.Instance;
    const projects = db.getProjects();
    for (let index = 0; index < projects.length; index++) {
      const proj = projects[index];
      proj.project.recreate.vscode.settings.changeColorTheme(false)
    }
    sleep(1);
    for (let index = 0; index < projects.length; index++) {
      const proj = projects[index];
      proj.project.recreate.vscode.settings.changeColorTheme()
    }
    sleep(1);
    for (let index = 0; index < projects.length; index++) {
      const proj = projects[index];
      proj.project.recreate.vscode.settings.gitReset()
    }
    process.exit(0)
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
