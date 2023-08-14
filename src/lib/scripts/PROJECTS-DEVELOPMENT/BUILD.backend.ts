//#region imports
import { _, crossPlatformPath } from 'tnp-core';
import * as express from 'express';
import { path } from 'tnp-core';
import { Project } from '../../project';
import type { ProjectDocker } from '../../project';
import { config, PREFIXES } from 'tnp-config';
import { Helpers } from 'tnp-helpers';
import { Models } from 'tnp-models';
//#endregion

//#region BUILD


const BUILD_DIST = async (args) => {
  let proj = Helpers.cliTool.resolveChildProject(args, Project.Current) as Project;
  if (proj.isSmartContainerChild) {
    proj = proj.parent;
  }
  await proj.buildProcess.startForLibFromArgs(false, false, 'dist', args);
};


const BUILD_DIST_WATCH = async (args) => {
  return (Project.Current as Project)
    .buildProcess
    .startForLibFromArgs(false, true, 'dist', args);
}

const DEV = async (args) => {
  args = `${args} --skipCopyToSelection`;
  return (Project.Current as Project)
    .buildProcess
    .startForLibFromArgs(false, true, 'dist', args);
}

const $CLEAN_BUILD = async (args) => {
  args += ' --nocache';
  await BUILD_DIST(args);
};

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


const $BUILD = async (args) => {
  await $BUILD_WATCH(args);
};

const $BUILD_TO_ALL = async (args) => {
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


const $BUILD_UP = async (args) => {
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

//#region BUILD / DEFAULT
async function $DEFAULT_BUILD(args) {
  const project = (Project.Current as Project);
  if (project.isStandaloneProject) {
    if (project.typeIs('angular-lib')) {
      await BUILD_DIST_WATCH(args);
      // await $BUILD_APP(args);
    } else if (project.typeIs('isomorphic-lib')) {
      await BUILD_DIST_WATCH(args);
    }
  } if (project.isWorkspaceChildProject) {
    await $BUILD(args);
  } else {
    process.exit(0);
  }
}
//#endregion

//#region BUILD / ALIASES
const BUILD_DIST_WATCH_ALL = async (args) => {
  args += ' --buildForAllClients';

  (Project.Current as Project).buildProcess.startForLibFromArgs(false, true, 'dist', args);
};
const BUILD_APP_WATCH = (args) => (Project.Current as Project).buildProcess.startForAppFromArgs(false, true, 'dist', args);

const $APP = (args) => (Project.Current as Project).buildProcess.startForAppFromArgs(false, true, 'dist', args);
const $WEBAPP = (args) => {
  args += ' --websql';
  return (Project.Current as Project).buildProcess.startForAppFromArgs(false, true, 'dist', args);
}


const $WEBSQL = (args) => {
  args += ' --websql';
  return (Project.Current as Project).buildProcess.startForAppFromArgs(false, true, 'dist', args);
}

const BUILD_NG = (args) => {
  args += ' --ngbuildonly';
  return (Project.Current as Project).buildProcess.startForLibFromArgs(false, false, 'dist', args);
};

const BUILD_NG_WATCH = (args) => {
  args += ' --ngbuildonly';
  return (Project.Current as Project).buildProcess.startForLibFromArgs(false, true, 'dist', args);
};

const BUILD_DIST_ALL = async (args) => {
  // console.log('AM FUCKING HEre',(Project.Current as Project).isGenerated)
  // process.exit(0)
  args += ' --buildForAllClients';
  await (Project.Current as Project).buildProcess.startForLibFromArgs(false, false, 'dist', args);
};

const BUILD_BUNDLE = (args) => (Project.Current as Project).buildProcess.startForLibFromArgs(false, false, 'bundle', args);

const BUILD_BUNDLE_PROD = (args) => (Project.Current as Project).buildProcess.startForLibFromArgs(true, false, 'bundle', args);

const $BUILD_BUNDLE_APP_PROD = (args) => (Project.Current as Project).buildProcess.startForAppFromArgs(true, false, 'bundle', args);

async function BUILD_LIB(args) {
  await BUILD_DIST(args);
}

async function BD(args) {
  await BUILD_DIST(args);
}

async function BL(args) {
  await BUILD_DIST(args);
}

async function BB(args) {
  await BUILD_BUNDLE(args);
}

const $BUILD_DIST_PROD = (args) => (Project.Current as Project).buildProcess.startForLibFromArgs(true, false, 'dist', args);
const $BUILD_BUNDLE_WATCH = (args) => (Project.Current as Project).buildProcess.startForLibFromArgs(false, true, 'bundle', args);
const $BUILD_BUNDLE_PROD = (args) => (Project.Current as Project).buildProcess.startForLibFromArgs(true, false, 'bundle', args);
const $BUILD_BUNDLE_PROD_WATCH = (args) => (Project.Current as Project).buildProcess.startForLibFromArgs(true, true, 'bundle', args);
const $BUILD_APP_PROD = (args) => (Project.Current as Project).buildProcess.startForAppFromArgs(true, false, 'dist', args);

const $BUILD_APP = (args) => (Project.Current as Project).buildProcess.startForAppFromArgs(false, false, 'dist', args);
const $BUILD_DIST_APP = (args) => (Project.Current as Project).buildProcess.startForAppFromArgs(false, false, 'dist', args);
const $BUILD_BUNDLE_APP = (args) => (Project.Current as Project).buildProcess.startForAppFromArgs(false, false, 'bundle', args);

const $BUILD_APP_WATCH_PROD = (args) => (Project.Current as Project).buildProcess.startForAppFromArgs(false, true, 'dist', args);
const $START_APP = async (args) => {
  await (Project.Current as Project).startServer(args);
};

const $BUILD_PROD = async (args) => {
  if ((Project.Current as Project).typeIs(...config.allowedTypes.libs)) {
    await (Project.Current as Project).buildProcess.startForLibFromArgs(true, false, 'dist', args);
  }
  if ((Project.Current as Project).typeIs(...config.allowedTypes.app)) {
    await (Project.Current as Project).buildProcess.startForAppFromArgs(true, false, 'dist', args);
  }
  process.exit(0);
};
const BUILD_LIB_WATCH = async (args) => BUILD_DIST_WATCH(args);
const BDW = (args) => BUILD_DIST_WATCH(args);
const BLW = (args) => BUILD_DIST_WATCH(args);
const $BAW = (args) => BUILD_APP_WATCH(args);
//#endregion

//#region BUILD / DOCS
async function $BUILD_DOCS(args) {
  if ((Project.Current as Project).isStandaloneProject) {
    await (Project.Current as Project).filesStructure.init('');
    await (Project.Current as Project).buildProcess.startForAppFromArgs(false, false, 'dist', args);
  }
  process.exit(0);
}

async function $BUILD_DOCS_PROD(args) {
  if ((Project.Current as Project).isStandaloneProject) {
    await (Project.Current as Project).filesStructure.init('');
    await (Project.Current as Project).buildProcess.startForAppFromArgs(true, false, 'dist', args);
  }
  process.exit(0);
}
//#endregion


//#endregion

//#region STATIC BUILD

const STATIC_BUILD_LIB = async (args) => {
  const staticVersionOfProject = await (Project.Current as Project).StaticVersion();
  if (staticVersionOfProject) {
    await staticVersionOfProject.buildProcess.startForLib({ args, staticBuildAllowed: true });
  } else {
    Helpers.log(`No static version for project: ${(Project.Current as Project).name}`);
  }

};

const STATIC_BUILD_PROD = async (args) => {
  const staticVersionOfProject = await (Project.Current as Project).StaticVersion();
  if (staticVersionOfProject) {
    await staticVersionOfProject.buildProcess.startForLib({ prod: true, args, staticBuildAllowed: true });
  } else {
    Helpers.log(`No static version for project: ${(Project.Current as Project).name}`);
  }
};

const STATIC_BUILD_LIB_PROD = async (args) => (await (Project.Current as Project).StaticVersion()).buildProcess
  .startForLib({ prod: true, args, staticBuildAllowed: true });

const STATIC_BUILD_APP = async (args) => (await (Project.Current as Project).StaticVersion()).buildProcess
  .startForApp({ args, staticBuildAllowed: true });

const STATIC_BUILD_APP_PROD = async (args) => (await (Project.Current as Project).StaticVersion()).buildProcess
  .startForApp({ prod: true, args, staticBuildAllowed: true });

const SBP = (args) => STATIC_BUILD_PROD(args);
const SBL = (args) => STATIC_BUILD_LIB(args);
const SBLP = (args) => STATIC_BUILD_LIB_PROD(args);
const SBA = (args) => STATIC_BUILD_APP(args);
const SBAP = (args) => STATIC_BUILD_APP_PROD(args);
//#endregion

//#region SERVE
const $SERVE = async (args) => {
  let proj = Helpers.cliTool.resolveChildProject(args, Project.Current) as Project;
  if (!proj) {
    proj = Project.nearestTo<Project>(crossPlatformPath(process.cwd()));
  }
  if (proj && proj.isStandaloneProject) {
    if (!proj.env || !proj.env.config || !proj.env.config.build.options) {
      Helpers.error(`Please build your project first`, false, true);
    }
    if (proj.typeIs('angular-lib') || (proj.typeIs('isomorphic-lib') && proj.frameworkVersionAtLeast('v3'))) {
      //#region serve angular lib
      const localUrl = `http://localhost:${8080}/${proj.name}/`;
      const app = express();
      const filesLocation = path.join(proj.location, config.folder.docs);
      const mainfestOverride = `/${proj.name}/${config.file.manifest_webmanifest}`;

      app.get(`/${proj.name}/*`, (req, res) => {
        // res.set('Service-Worker-Allowed',
        //   [
        //     '/bs4-breakpoint/',
        //   ].join(', '))

        // console.log(`path: "${req.path}"`)
        // console.log(`ORIG: "${req.originalUrl}"`)
        let filePath = req.originalUrl
          .replace(/\/$/, '')
          .replace(new RegExp(Helpers.escapeStringForRegEx(`/${proj.name}`)), '')
          .replace(new RegExp(Helpers.escapeStringForRegEx(`/${proj.name}`)), '') // QUICKFIX
          .replace(/^\//, '');
        // console.log(`path file: "${filePath}"`)
        // res.send(filePath)
        // res.end()
        if (filePath.includes('?')) {
          filePath = filePath.split('?')[0];
        }
        if (filePath === '') {
          filePath = 'index.html';
        }

        if (filePath === config.file.manifest_webmanifest) {
          const localMainfest = path.join(filesLocation, config.file.manifest_webmanifest);
          const file = JSON.parse(Helpers.readFile(localMainfest));
          file.start_url = localUrl;
          // console.log('mainfest override')
          res.json(file);
        } else {
          res.sendFile(filePath, { root: filesLocation });
        }
      });
      app.listen(8080, () => {
        console.log(`${config.frameworkName} standalone serve is runnning on: ${localUrl}`);
      });
      //#endregion
    }
    if (proj.typeIs('isomorphic-lib', 'docker')) {
      await proj.startServer(args);
    }

  } else {
    const configServe: Models.dev.BuildServeArgsServe = require('minimist')(args.split(' '));
    if (!configServe.port && !configServe.baseUrl && !configServe.outDir) {
      Helpers.error(`Bad arguments for ${config.frameworkName} serve: ${configServe}`);
    }
    const app = express();
    app.use(configServe.baseUrl, express.static(crossPlatformPath(path.join(crossPlatformPath(process.cwd()), configServe.outDir))));
    app.listen(configServe.port, () => {
      console.log(`${config.frameworkName} serve is runnning on: http://localhost:${configServe.port}${configServe.baseUrl}

      Access project link: http://localhost:${proj.env.config.workspace.workspace.port}${configServe.baseUrl}

      `);
    });
  }

};

const $START = async (args) => {
  const proj = Helpers.cliTool.resolveChildProject(args, Project.Current) as Project;

  if (proj.isStandaloneProject || proj.isSmartContainer) {
    args = `${args} --serveApp`;
    await (Project.Current as Project)
      .buildProcess
      .startForLibFromArgs(false, true, 'dist', args);
  }
};

const $START_WATCH = async (args) => {
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


const $REVERT = async (args: string) => {

  //#region delete global
  const deleteGlobalPkg = async (prefixedPath: string, isSmartContainer: boolean, packageName: string, container: Project) => {
    Helpers.info(`
Package${isSmartContainer ? 's from' : ''} "${packageName}"
${isSmartContainer ? 'were' : 'was'} not originally in global container.
    `)
    if (await Helpers.questionYesNo(`Would you like to remove this package from global container ?`)) {
      const orgNormalPath = prefixedPath.replace(PREFIXES.RESTORE_NPM, '');
      Helpers.removeFolderIfExists(orgNormalPath);
      Helpers.success(`DONE package${isSmartContainer ? 's from' : ''} ${packageName} removed from global container (since they don't belong to him).`);

    }
  }
  //#endregion

  //#region restore
  const restorePreviousGlobalPkg = async (prefixedPath: string, isSmartContainer: boolean, packageName: string, ask = false) => {

    const restoreAction = async () => {
      const orgNormalPath = prefixedPath.replace(PREFIXES.RESTORE_NPM, '');
      Helpers.removeFolderIfExists(orgNormalPath);
      Helpers.move(prefixedPath, orgNormalPath);
      if (isSmartContainer) {
        Helpers.info(`Revert done.. now you are using globally npm version of packages from "${packageName}"`)
      } else {
        Helpers.info(`Revert done.. now you are using globally npm version of package "${packageName}"`)
      }

      Helpers.success(`DONE package${isSmartContainer ? 's from' : ''} ${packageName} reverted to original state in core container.`)
    };

    if (ask) {
      if (await Helpers.questionYesNo(`Are you sure about globally reverting  package${isSmartContainer ? 's from' : ''} ${packageName} ?`)) {
        await restoreAction();
      }
    } else {
      await restoreAction();
    }
  }
  //#endregion

  const whenNothing = async (packageName: string, container: Project) => {

    Helpers.info(`Nothing to globally revert for package "${packageName}"`);

    const packages = Helpers
      .foldersFrom(container.smartNodeModules.path)
      .filter(f => path.basename(f).startsWith(PREFIXES.RESTORE_NPM))
      ;

    if (packages.length > 0) {
      if (await Helpers.questionYesNo(`Would you like to see a list of packages that can be reverted ?`)) {
        const choices = packages.map(c => {
          return {
            name: path.basename(c).replace(PREFIXES.RESTORE_NPM, ''),
            value: c
          }
        })

        const selected = await Helpers.multipleChoicesAsk('Choose packages to revert', choices);

        for (let index = 0; index < selected.length; index++) {
          const toRestore = selected[index];
          const packageName = path.basename(toRestore).replace(PREFIXES.RESTORE_NPM, '');
          await restorePreviousGlobalPkg(toRestore, packageName.startsWith('@'), packageName);
        }
      }
    }
  };


  const getPackagesFromContainer = (container: Project, packageName) => {
    container.packageJson.showDeps('For reverting packages')
    const pj = Helpers.readJson(container.packageJson.path) as Models.npm.IPackageJSON;
    const availablePackages = {
      ...(pj?.dependencies || {}),
      ...(pj?.devDependencies || {}),
      ...(pj?.peerDependencies || {}),
    };
    const wasOriginaly = !_.isUndefined(Object.keys(availablePackages).find(key => key.startsWith(packageName)));
    return wasOriginaly;
  }

  const proj = Project.Current as Project;
  const projName = (args.trim() === '') ? proj?.name : args.trim();
  const container = Project.by('container', proj._frameworkVersion) as Project;
  if (container) {

    const isSmartContainer = (args.trim() === '') ? proj?.isSmartContainer : projName.startsWith('@');
    const packageName = (isSmartContainer ? '@' : '') + projName;
    const wasOriginaly = getPackagesFromContainer(container, packageName);
    const prefixedPath = crossPlatformPath([container.smartNodeModules.path, (PREFIXES.RESTORE_NPM + packageName)]);
    const orgNormalPath = prefixedPath.replace(PREFIXES.RESTORE_NPM, '');

    if (wasOriginaly) {
      if (Helpers.exists(prefixedPath)) {
        await restorePreviousGlobalPkg(prefixedPath, isSmartContainer, packageName, true);
      } else {
        await whenNothing(packageName, container);
      }
    } else {
      if (Helpers.exists(orgNormalPath)) {
        await deleteGlobalPkg(prefixedPath, isSmartContainer, packageName, container);
      } else {
        await whenNothing(packageName, container);
      }
    }

  }

  process.exit(0)
};



const $RUN = async (args) => {

};
//#endregion

//#region OTHER
const $RECREATE = () => {
  const proj = Project.Current;
  if (proj.isContainer) {
    const childs = (proj.children as Project[])
      .filter(c => c.frameworkVersionAtLeast('v2') && !c.isTnp);
    for (let index = 0; index < childs.length; index++) {
      const c = childs[index];
      c.git.restoreLastVersion(config.file.package_json);
    }
    Project.projects = [];
    for (let index = 0; index < childs.length; index++) {
      let c = childs[index];
      childs[index] = Project.From(c.location);
      c = childs[index];
      Helpers.info(`Saving package for ${c.location}`);
      c.packageJson.save(`rereating container`);
    }
  }
  process.exit(0);
};

const $BACKUP = async (args) => {
  const proj = Helpers.cliTool.resolveChildProject(args, Project.Current) as ProjectDocker;
  if (proj.isDocker) {
    await proj.saveToFile();
  }
  process.exit(0);
};

const $STATIC_START = async (args) => $START(args);

const $INSTALL_LOCALLY = async (args) => {
  const argsObj: Models.dev.ReleaseOptions = require('minimist')(args.split(' '));
  argsObj.args = args;
  const proj = Helpers.cliTool.resolveChildProject(args, Project.Current) as Project;
  if (proj.isVscodeExtension) {
    await proj.vscodext.installLocaly(argsObj);
  }
  process.exit(0);
};

const $STOP = async (args) => {
  const proj = Helpers.cliTool.resolveChildProject(args, Project.Current);
  if (proj) {
    (proj as ProjectDocker).stop();
  }
  process.exit(0);
};


//#endregion

export default {
  //#region export default
  DEV: Helpers.CLIWRAP(DEV, 'DEV'),
  $BUILD_UP: Helpers.CLIWRAP($BUILD_UP, '$BUILD_UP'),
  BUILD_NG: Helpers.CLIWRAP(BUILD_NG, 'BUILD_NG'),
  BUILD_NG_WATCH: Helpers.CLIWRAP(BUILD_NG_WATCH, 'BUILD_NG_WATCH'),
  $RECREATE: Helpers.CLIWRAP($RECREATE, '$RECREATE'),
  $BUILD_DOCS: Helpers.CLIWRAP($BUILD_DOCS, '$BUILD_DOCS'),
  $BUILD_DOCS_PROD: Helpers.CLIWRAP($BUILD_DOCS_PROD, '$BUILD_DOCS_PROD'),
  $BUILD: Helpers.CLIWRAP($BUILD, '$BUILD'),
  $CLEAN_BUILD: Helpers.CLIWRAP($CLEAN_BUILD, '$CLEAN_BUILD'),
  $BUILD_WATCH: Helpers.CLIWRAP($BUILD_WATCH, '$BUILD_WATCH'),
  $BUILD_TO_ALL: Helpers.CLIWRAP($BUILD_TO_ALL, '$BUILD_TO_ALL'),
  $DEFAULT_BUILD: Helpers.CLIWRAP($DEFAULT_BUILD, '$DEFAULT_BUILD'),
  BUILD_DIST: Helpers.CLIWRAP(BUILD_DIST, 'BUILD_DIST'),
  BUILD_DIST_ALL: Helpers.CLIWRAP(BUILD_DIST_ALL, 'BUILD_DIST_ALL'),
  BUILD_LIB: Helpers.CLIWRAP(BUILD_LIB, 'BUILD_LIB'),
  BD: Helpers.CLIWRAP(BD, 'BD'),
  BL: Helpers.CLIWRAP(BL, 'BL'),
  BUILD_BUNDLE_PROD: Helpers.CLIWRAP(BUILD_BUNDLE_PROD, 'BUILD_BUNDLE_PROD'),
  BUILD_BUNDLE: Helpers.CLIWRAP(BUILD_BUNDLE, 'BUILD_BUNDLE'),
  BB: Helpers.CLIWRAP(BB, 'BB'),
  BUILD_DIST_WATCH: Helpers.CLIWRAP(BUILD_DIST_WATCH, 'BUILD_DIST_WATCH'),
  BUILD_DIST_WATCH_ALL: Helpers.CLIWRAP(BUILD_DIST_WATCH_ALL, 'BUILD_DIST_WATCH_ALL'),
  BDW: Helpers.CLIWRAP(BDW, 'BDW'),
  BUILD_LIB_WATCH: Helpers.CLIWRAP(BUILD_LIB_WATCH, 'BUILD_LIB_WATCH'),
  BLW: Helpers.CLIWRAP(BLW, 'BLW'),
  BUILD_APP_WATCH: Helpers.CLIWRAP(BUILD_APP_WATCH, 'BUILD_APP_WATCH'),
  $APP: Helpers.CLIWRAP($APP, '$APP'),
  $WEBAPP: Helpers.CLIWRAP($WEBAPP, '$WEBAPP'),
  $WEBSQL: Helpers.CLIWRAP($WEBSQL, '$WEBSQL'),
  $BAW: Helpers.CLIWRAP($BAW, '$BAW'),
  $BUILD_DIST_PROD: Helpers.CLIWRAP($BUILD_DIST_PROD, '$BUILD_DIST_PROD'),
  $BUILD_BUNDLE_WATCH: Helpers.CLIWRAP($BUILD_BUNDLE_WATCH, '$BUILD_BUNDLE_WATCH'),
  $BUILD_BUNDLE_PROD: Helpers.CLIWRAP($BUILD_BUNDLE_PROD, '$BUILD_BUNDLE_PROD'),
  $BUILD_BUNDLE_APP_PROD: Helpers.CLIWRAP($BUILD_BUNDLE_APP_PROD, '$BUILD_BUNDLE_APP_PROD'),
  $BUILD_BUNDLE_PROD_WATCH: Helpers.CLIWRAP($BUILD_BUNDLE_PROD_WATCH, '$BUILD_BUNDLE_PROD_WATCH'),
  $BUILD_APP_PROD: Helpers.CLIWRAP($BUILD_APP_PROD, '$BUILD_APP_PROD'),
  $BUILD_APP: Helpers.CLIWRAP($BUILD_APP, '$BUILD_APP'),
  $BUILD_DIST_APP: Helpers.CLIWRAP($BUILD_DIST_APP, '$BUILD_DIST_APP'),
  $BUILD_BUNDLE_APP: Helpers.CLIWRAP($BUILD_BUNDLE_APP, '$BUILD_BUNDLE_APP'),

  $BUILD_APP_WATCH_PROD: Helpers.CLIWRAP($BUILD_APP_WATCH_PROD, '$BUILD_APP_WATCH_PROD'),
  $START_APP: Helpers.CLIWRAP($START_APP, '$START_APP'),
  $BUILD_PROD: Helpers.CLIWRAP($BUILD_PROD, '$BUILD_PROD'),
  $START: Helpers.CLIWRAP($START, '$START'),
  $START_WATCH: Helpers.CLIWRAP($START_WATCH, '$START_WATCH'),
  // $RUN: Helpers.CLIWRAP($RUN, '$RUN'),
  $STOP: Helpers.CLIWRAP($STOP, '$STOP'),
  $STATIC_START: Helpers.CLIWRAP($STATIC_START, '$STATIC_START'),
  $SERVE: Helpers.CLIWRAP($SERVE, '$SERVE'),
  $INSTALL_LOCALLY: Helpers.CLIWRAP($INSTALL_LOCALLY, '$INSTALL_LOCALLY'),
  $BACKUP: Helpers.CLIWRAP($BACKUP, '$BACKUP'),
  $REVERT: Helpers.CLIWRAP($REVERT, '$REVERT'),
  //#endregion
};
