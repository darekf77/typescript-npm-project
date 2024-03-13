//#region imports
import { _, crossPlatformPath } from 'tnp-core/src';
import * as express from 'express';
import { path } from 'tnp-core/src';
import { Project } from '../../project/abstract/project/project';
import { config, PREFIXES } from 'tnp-config/src';
import { Helpers } from 'tnp-helpers/src';
import { Models } from 'tnp-models/src';
import { TEMP_DOCS } from '../../constants';
//#endregion

//#region BUILD

//#region BUILD / build:watch

const $BUILD_WATCH = async (args) => {
  let proj = Helpers.cliTool.resolveChildProject(args, Project.Current) as Project;
  if (proj.isSmartContainerChild) {
    Helpers.error(`Smart container build only available from container level. `, false, true)
  } else {
    if ((proj.isStandaloneProject || proj.isSmartContainer) && proj.typeIsNot('vscode-ext')) {
      // TODO skipCopyToSelection no loger ipmortant
      args = `${args} --skipCopyToSelection --copytoAll`;
    }
    await proj.buildProcess.startForLibFromArgs(false, true, 'dist', args);
  }
};
//#endregion

//#region BUILD / build
const $BUILD = async (args) => {
  let proj = Helpers.cliTool.resolveChildProject(args, Project.Current) as Project;
  if (proj.isSmartContainerChild) {
    Helpers.error(`Smart container build only available from container level. `, false, true)
  } else {
    if ((proj.isStandaloneProject || proj.isSmartContainer) && proj.typeIsNot('vscode-ext')) {
      // TODO skipCopyToSelection no loger ipmortant
      args = `${args} --skipCopyToSelection --copytoAll`;
    }
    await proj.buildProcess.startForLibFromArgs(false, false, 'dist', args);
  }
};
//#endregion

//#region BUILD / default:build (vscpde ctr|cmd + shift + b)
/**
 * For vscode default build
 */
async function $DEFAULT_BUILD(args) {
  await $BUILD_WATCH(args);
}
//#endregion

//#region BUILD / app
/**
 * watch build for app
 *
 * $ firedev app  # sqlite (default), mysql, postgress + docker up
 * $ firedev app --websql   # in browser websql
 */
const $APP = (args) => (Project.Current as Project).buildProcess.startForAppFromArgs(false, true, 'dist', args);
//#endregion

//#region BUILD / build app prod
const $BUILD_APP_PROD = (args) => (Project.Current as Project).buildProcess.startForAppFromArgs(true, false, 'dist', args);
//#endregion

//#region BUILD / build app
const $BUILD_APP = (args) => (Project.Current as Project).buildProcess.startForAppFromArgs(false, false, 'dist', args);
//#endregion

//#region BUILD / start
/**
 * quick lib/app bootstrapp watch build
 */
const $START = async (args) => {
  const proj = Helpers.cliTool.resolveChildProject(args, Project.Current) as Project;

  if (proj.isStandaloneProject || proj.isSmartContainer) {
    if (proj.typeIsNot('vscode-ext')) {
      // TODO skipCopyToSelection no loger ipmortant
      args = `${args} --skipCopyToSelection --copytoAll`;
    }
    args = `${args} --serveApp`;
    await (Project.Current as Project)
      .buildProcess
      .startForLibFromArgs(false, true, 'dist', args);
  }
};
//#endregion

//#endregion

//#region MKDOCS
export const DocsActions = {
  //#region @notForNpm
  SELECT_COMMAND: {
    name: '< select command >',
  },
  BUILD_DEPLY_DOCS_FIREDEV: {
    name: 'Build & deply docs for www.firedev.io',
    value: {
      command: `python -m mkdocs build --site-dir ../../firedev-projects/www-firedev-io/docs/documentation`,
      action: async () => {
        const firedevProj = Project.From([process.cwd(), '../../firedev-projects/www-firedev-io']);
        if (await Helpers.questionYesNo('Push and commit docs update ?')) {
          firedevProj.git.commit('update docs');
          firedevProj.git.pushCurrentBranch()
        }
      }
    },
  },
  BUILD_DOCS_FIREDEV: {
    name: 'Build docs for www.firedev.io',
    value: {
      command: `python -m mkdocs build --site-dir ../../firedev-projects/www-firedev-io/${TEMP_DOCS}`,
      action: void 0,
    },
  },
  //#endregion
  SERVE_DOCS_FIREDEV: {
    name: 'Serve docs for www.firedev.io on 8000',
    value: {
      command: 'python -m mkdocs serve',
      action: void 0,
    },
  },
}

/**
 * documentation from /documentation folder NOT /docs fodler
 */
async function $MKDOCS(args) {

  const proj = Project.Current as Project;

  let res;
  while (true) {
    Helpers.clearConsole()
    res = await Helpers.consoleGui.select('What you wanna do with docs ?', Object.values(DocsActions) as any);
    if (res.command) {
      break;
    }
  }

  proj.run(res.command, { output: true }).sync();
  if (_.isFunction(res.action)) {
    await res.action();
  }
  Helpers.info('DONE BUILDING DOCS')
  process.exit(0);
}
//#endregion


//#region VSCODE INSTALL LOCALLY
const $INSTALL_LOCALLY = async (args) => {
  const argsObj: Models.dev.ReleaseOptions = require('minimist')(args.split(' '));
  argsObj.args = args;
  const proj = Helpers.cliTool.resolveChildProject(args, Project.Current) as Project;
  if (proj.isVscodeExtension) {
    await proj.vscodext.installLocaly(argsObj);
  }
  process.exit(0);
};

//#endregion

//#region electron
const ELECTRON_WATCH = async (args: string) => {
  const proj = Project.Current as Project;
  if (proj.isStandaloneProject) {
    await proj.serverElectron(args);
  } else {
    Helpers.error(`Electron apps compilation only for standalone projects`, false, true);
  }
}

const ELECTRON_BUILD = async (args: string) => {
  const proj = Project.Current as Project;
  if (proj.isStandaloneProject) {
    await proj.buildElectron('dist', args);
  } else {
    Helpers.error(`Electron apps compilation only for standalone projects`, false, true);
  }
  process.exit(0)
}


const ELECTRON_BUILD_RELEASE = async (args: string) => {
  const proj = Project.Current as Project;
  if (proj.isStandaloneProject) {
    await proj.buildElectron('dist', args);
  } else {
    Helpers.error(`Electron apps compilation only for standalone projects`, false, true);
  }
  process.exit(0)
}
//#endregion

//#region inactive links
const INACTIVE_LINKS = async () => {
  const proj = Project.Current as Project;
  const unexistedLinks = Helpers
    .linksToFolderFrom(proj.pathFor(config.folder.node_modules))
    .filter(link => Helpers.isUnexistedLink(link));
  ;
  console.log({ unexistedLinks })
  process.exit(0)
}
//#endregion


export default {
  //#region export default
  INACTIVE_LINKS: Helpers.CLIWRAP(INACTIVE_LINKS, 'INACTIVE_LINKS'),
  ELECTRON_WATCH: Helpers.CLIWRAP(ELECTRON_WATCH, 'ELECTRON_WATCH'),
  ELECTRON_BUILD: Helpers.CLIWRAP(ELECTRON_BUILD, 'ELECTRON_BUILD'),
  ELECTRON_BUILD_RELEASE: Helpers.CLIWRAP(ELECTRON_BUILD_RELEASE, 'ELECTRON_BUILD_RELEASE'),
  $BUILD: Helpers.CLIWRAP($BUILD, '$BUILD'),
  $BUILD_WATCH: Helpers.CLIWRAP($BUILD_WATCH, '$BUILD_WATCH'),
  $DEFAULT_BUILD: Helpers.CLIWRAP($DEFAULT_BUILD, '$DEFAULT_BUILD'),
  $APP: Helpers.CLIWRAP($APP, '$APP'),
  $BUILD_APP_PROD: Helpers.CLIWRAP($BUILD_APP_PROD, '$BUILD_APP_PROD'),
  $BUILD_APP: Helpers.CLIWRAP($BUILD_APP, '$BUILD_APP'),
  $START: Helpers.CLIWRAP($START, '$START'),
  $INSTALL_LOCALLY: Helpers.CLIWRAP($INSTALL_LOCALLY, '$INSTALL_LOCALLY'),
  $MKDOCS: Helpers.CLIWRAP($MKDOCS, '$MKDOCS'),
  //#endregion
};
