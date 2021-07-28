//#region imports
import { _, crossPlatformPath } from 'tnp-core';
import * as express from 'express';
import { path } from 'tnp-core';
import { TnpDB } from 'tnp-db';
import { Project } from '../../project';
import type { ProjectDocker } from '../../project';
import { config } from 'tnp-config';
import { Helpers } from 'tnp-helpers';
import { Models } from 'tnp-models';
import chalk from 'chalk';
import { chainBuild } from './chain-build.backend';
//#endregion

//#region BUILD

const $BUILD = async (args) => {
  await chainBuild(args);
};

const BUILD_DIST = async (args) => {
  const proj = Helpers.cliTool.resolveChildProject(args, Project.Current) as Project;
  await proj.buildProcess.startForLibFromArgs(false, false, 'dist', args);
};

const BUILD_DIST_WATCH = async (args) => (Project.Current as Project)
  .buildProcess
  .startForLibFromArgs(false, true, 'dist', args);

const $CLEAN_BUILD = async (args) => {
  args += ' --nocache';
  await BUILD_DIST(args);
};

const $BUILDWATCH = async (args) => {
  const proj = Helpers.cliTool.resolveChildProject(args, Project.Current) as Project;
  if (proj.isStandaloneProject && proj.typeIsNot('vscode-ext')) {
    // TODO skipCopyToSelection no loger ipmortant
    args = `${args} --skipCopyToSelection --copytoAll`;
  }
  await proj.buildProcess.startForLibFromArgs(false, true, 'dist', args);
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

const BUILD_DIST_ALL = async (args) => {
  // console.log('AM FUCKING HEre',(Project.Current as Project).isGenerated)
  // process.exit(0)
  args += ' --buildForAllClients';
  await (Project.Current as Project).buildProcess.startForLibFromArgs(false, false, 'dist', args);
};

const BUILD_BUNDLE = (args) => (Project.Current as Project).buildProcess.startForLibFromArgs(false, false, 'bundle', args);
const BUILD_BUNDLE_PROD = (args) => (Project.Current as Project).buildProcess.startForLibFromArgs(true, false, 'bundle', args);

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
const $BUILD_APP_WATCH_PROD = (args) => (Project.Current as Project).buildProcess.startForAppFromArgs(false, true, 'dist', args);
const $START_APP = async (args) => {
  await (Project.Current as Project).start(args);
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

//#region BUILD / STOP BUILD WATCH
const $STOP_BUILD_DIST_WATCH = async (args) => {
  const db = await TnpDB.Instance();
  const projectLocation = (Project.Current as Project).location;
  await db.updateProcesses();
  const pidsToKill = (await db.getBuilds())
    .filter(f =>
      f.location === projectLocation
      && f.buildOptions
      && f.buildOptions.watch
      && !f.buildOptions.appBuild
    )
    .map(f => f.pid);
  Helpers.info(`Killing build dist process in ${projectLocation}`);
  for (let index = 0; index < pidsToKill.length; index++) {
    const pid = pidsToKill[index];
    try {
      Helpers.killProcess(pid);
      Helpers.info(`Process killed on pid ${pid}`);
    } catch (error) {
      Helpers.warn(`Not able to kill process on pid ${pid}`);
    }
  }
  Helpers.info('Done');
  process.exit(0);
};
//#endregion

//#region BUILD / SINGLUAR (deprecated)
async function $ACTIVE_SINGULAR_BUILD(args) {
  await (Project.Current as Project).hasParentWithSingularBuild();
  // process.stdout.write();
  process.exit(0);
}
//#endregion

//#endregion

//#region STATIC BUILD
const STATIC_BUILD = async (args) => {
  if (!(Project.Current as Project).isWorkspace) {
    Helpers.error(`Please use:
${chalk.gray(`$ ${config.frameworkName} static:build:lib`)}
or
${chalk.gray(`$ ${config.frameworkName} static:build:app`)}

inside workspace children.
    `, false, true);
  }
  const staticVersionOfProject = await (Project.Current as Project).StaticVersion();
  if (staticVersionOfProject) {
    await staticVersionOfProject.buildProcess.startForLib({ args, staticBuildAllowed: true });
  } else {
    Helpers.log(`No static version for project: ${(Project.Current as Project).name}`);
  }

};

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

const SB = (args) => STATIC_BUILD(args);
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
    if (proj.typeIs('angular-lib')) {
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
      await proj.start(args);
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

  if (proj.isStandaloneProject) {
    await $SERVE(args);
    return;
  }
  if (!proj.isWorkspace) {
    Helpers.error(`Please use this command only on workspace level`, false, true);
  }
  await proj.start(args);
};

const $RUN = async (args) => {
  await $START(args);
};
//#endregion

//#region RELEASE

const $RELEASE_ALL = async (args: string) => {
  const all = `--all`
  await $RELEASE(args.replace(new RegExp(Helpers.escapeStringForRegEx(`--all`), 'g'), '') + ' ' + all);
};

//#region RELEASE / NORMAL
const $RELEASE = async (args: string) => {

  //#region prepare relase args
  // Helpers.log(`ARR ARGS "${args}"`)
  const argsObj: Models.dev.ReleaseOptions = require('minimist')(args.split(' '));
  argsObj.args = args;
  // Helpers.log(`ARGS RELEASE

  // ${Helpers.stringify(argsObj)}

  // `)
  const releaseAll = !!argsObj.all;

  const proj = Project.Current as Project;
  //  Helpers.cliTool.resolveChildProject(args, Project.Current) as Project;

  proj.packageJson.showDeps('Release');
  //#endregion

  if (proj.isContainer) {
    //#region container release
    global.tnpNonInteractive = true;

    const { resolved, commandString } = Helpers.cliTool.argsFromBegin<Project>(args, (a) => {
      return Project.From(path.join(proj.location, a));
    });
    args = commandString;


    const npmDeps = proj.projectsInOrderForChainBuild(resolved)
      .filter(d => d.name !== proj.name && !d.isPrivate);
    const otherDeps = proj.children.filter(c => {
      return !npmDeps.includes(c);
    });

    const deps = [
      ...npmDeps,
      ...otherDeps,
    ];
    //#region projs tempalte
    const projsTemplate = (child?: Project) => {
      return `

    PROJECTS FOR RELEASE CHAIN:

${deps.map((p, i) => {
        const bold = (child?.name === p.name);
        const index = i + 1;
        return `(${bold ? chalk.underline(chalk.bold(index.toString()))  : index}. ${bold ? chalk.bold(p.name) : p.name})`;
      }).join(', ')}


${Helpers.terminalLine()}
processing...
    `;
    };
    //#endregion

    for (let index = 0; index < deps.length; index++) {
      Helpers.clearConsole();
      const child = deps[index] as Project;

      Helpers.info(projsTemplate(child));

      const lastBuildHash = child.packageJson.getBuildHash();
      const lastTagHash = child.git.lastTagHash();
      const sameHashes = (lastBuildHash === lastTagHash); // TODO QUICK FIX
      if (!sameHashes || releaseAll) {
        while (true) {
          try {
            await child.run(`${config.frameworkName} release `
              + ` --automaticRelease=true --tnpNonInteractive=true ${global.hideLog ? '' : '-verbose'}`
              , { prefix: `[container ${chalk.bold(proj.name)}/${child.name} release]`, output: true }).asyncAsPromise();
            // await child.release(handleStandalone(child, {}), true);
            break;
          } catch (error) {
            Helpers.pressKeyAndContinue(`Please fix your project ${chalk.bold(child.name)} and try again..`);
          }
        }
      } else {
        Helpers.warn(`

        No realase needed for ${chalk.bold(child.name)} ..just initing and pushing to git...

        `); // hash in package.json to check

        while (true) {
          try {
            await child.run(`${config.frameworkName} init`
              + ` --tnpNonInteractive=true ${global.hideLog ? '' : '-verbose'}`,
              { prefix: `[container ${chalk.bold(proj.name)} release]`, output: true }).asyncAsPromise();
            break;
          } catch (error) {
            Helpers.pressKeyAndContinue(`Please fix your project ${chalk.bold(child.name)} and try again..`);
          }
        }

        // Helpers.pressKeyAndContinue();
        child.git.commit();
        await child.git.pushCurrentBranch();
      }
      // Helpers.pressKeyAndContinue(`Press any key to release ${chalk.bold(child.genericName)}`);

    }
    Helpers.clearConsole();
    Helpers.info(projsTemplate());

    proj.git.commit(`Up4date after release`);
    await proj.git.pushCurrentBranch();
    Project.Tnp.git.commit(`Update after release`);
    await Project.Tnp.git.pushCurrentBranch();
    Helpers.info(`


    R E L E A S E   O F   C O N T I A I N E R  ${chalk.bold(proj.genericName)}  D O N E


    `);
    process.exit(0);

    //#endregion
  } else {
    Helpers.log(`argsObj.automaticRelease: ${argsObj.automaticRelease}`)
    await proj.release(handleStandalone(proj, argsObj), !!argsObj.automaticRelease);
  }
  process.exit(0);
};

function handleStandalone(proj: Project, argsObj: any) {
  if (proj.packageJson.libReleaseOptions.obscure) {
    argsObj.obscure = true;
  }
  if (proj.packageJson.libReleaseOptions.ugly) {
    argsObj.uglify = true;
  }
  if (proj.packageJson.libReleaseOptions.nodts) {
    argsObj.nodts = true;
  }
  return argsObj;
}

//#endregion

//#region RELEASE / OBSCURE
const $RELEASE_OBSCURED = async (args) => {
  const argsObj: Models.dev.ReleaseOptions = require('minimist')(args.split(' '));
  argsObj.obscure = true;
  argsObj.uglify = true;
  argsObj.prod = true;
  argsObj.args = args;
  const proj = (Project.Current as Project);
  proj.checkIfReadyForNpm();
  proj.packageJson.showDeps('Release');
  await proj.release(argsObj);

  process.exit(0);
};
//#endregion

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
  await proj.saveToFile();
  process.exit(0);
};

const $STATIC_START = async (args) => $START(args);

const $INSTALL_LOCALLY = async (args) => {
  const argsObj: Models.dev.ReleaseOptions = require('minimist')(args.split(' '));
  argsObj.args = args;
  const proj = Helpers.cliTool.resolveChildProject(args, Project.Current) as Project;
  if (proj.isVscodeExtension) {
    await proj.installLocaly(argsObj);
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



async function $DB_BUILDS_UPDATE() {
  const db = await TnpDB.Instance();
  await db.updateProcesses();
  process.exit(0);
}

//#endregion

export default {
  //#region export default
  $RECREATE: Helpers.CLIWRAP($RECREATE, '$RECREATE'),
  $BUILD_DOCS: Helpers.CLIWRAP($BUILD_DOCS, '$BUILD_DOCS'),
  $BUILD_DOCS_PROD: Helpers.CLIWRAP($BUILD_DOCS_PROD, '$BUILD_DOCS_PROD'),
  $BUILD: Helpers.CLIWRAP($BUILD, '$BUILD'),
  $CLEAN_BUILD: Helpers.CLIWRAP($CLEAN_BUILD, '$CLEAN_BUILD'),
  $BUILDWATCH: Helpers.CLIWRAP($BUILDWATCH, '$BUILDWATCH'),
  $ACTIVE_SINGULAR_BUILD: Helpers.CLIWRAP($ACTIVE_SINGULAR_BUILD, '$ACTIVE_SINGULAR_BUILD'),
  $DEFAULT_BUILD: Helpers.CLIWRAP($DEFAULT_BUILD, '$DEFAULT_BUILD'),
  $DB_BUILDS_UPDATE: Helpers.CLIWRAP($DB_BUILDS_UPDATE, '$DB_BUILDS_UPDATE'),
  $STOP_BUILD_DIST_WATCH: Helpers.CLIWRAP($STOP_BUILD_DIST_WATCH, '$STOP_BUILD_DIST_WATCH'),
  STATIC_BUILD: Helpers.CLIWRAP(STATIC_BUILD, 'STATIC_BUILD'),
  SB: Helpers.CLIWRAP(SB, 'SB'),
  STATIC_BUILD_PROD: Helpers.CLIWRAP(STATIC_BUILD_PROD, 'STATIC_BUILD_PROD'),
  SBP: Helpers.CLIWRAP(STATIC_BUILD_PROD, 'STATIC_BUILD_PROD'),
  STATIC_BUILD_LIB: Helpers.CLIWRAP(STATIC_BUILD_LIB, 'STATIC_BUILD_LIB'),
  SBL: Helpers.CLIWRAP(SBL, 'SBL'),
  STATIC_BUILD_LIB_PROD: Helpers.CLIWRAP(STATIC_BUILD_LIB_PROD, 'STATIC_BUILD_LIB_PROD'),
  SBLP: Helpers.CLIWRAP(SBLP, 'SBLP'),
  STATIC_BUILD_APP: Helpers.CLIWRAP(STATIC_BUILD_APP, 'STATIC_BUILD_APP'),
  SBA: Helpers.CLIWRAP(SBA, 'SBA'),
  STATIC_BUILD_APP_PROD: Helpers.CLIWRAP(STATIC_BUILD_APP_PROD, 'STATIC_BUILD_APP_PROD'),
  SBAP: Helpers.CLIWRAP(SBAP, 'SBAP'),
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
  $BAW: Helpers.CLIWRAP($BAW, '$BAW'),
  $BUILD_DIST_PROD: Helpers.CLIWRAP($BUILD_DIST_PROD, '$BUILD_DIST_PROD'),
  $BUILD_BUNDLE_WATCH: Helpers.CLIWRAP($BUILD_BUNDLE_WATCH, '$BUILD_BUNDLE_WATCH'),
  $BUILD_BUNDLE_PROD: Helpers.CLIWRAP($BUILD_BUNDLE_PROD, '$BUILD_BUNDLE_PROD'),
  $BUILD_BUNDLE_PROD_WATCH: Helpers.CLIWRAP($BUILD_BUNDLE_PROD_WATCH, '$BUILD_BUNDLE_PROD_WATCH'),
  $BUILD_APP_PROD: Helpers.CLIWRAP($BUILD_APP_PROD, '$BUILD_APP_PROD'),
  $BUILD_APP: Helpers.CLIWRAP($BUILD_APP, '$BUILD_APP'),
  $BUILD_APP_WATCH_PROD: Helpers.CLIWRAP($BUILD_APP_WATCH_PROD, '$BUILD_APP_WATCH_PROD'),
  $START_APP: Helpers.CLIWRAP($START_APP, '$START_APP'),
  $BUILD_PROD: Helpers.CLIWRAP($BUILD_PROD, '$BUILD_PROD'),
  $START: Helpers.CLIWRAP($START, '$START'),
  $RUN: Helpers.CLIWRAP($RUN, '$RUN'),
  $STOP: Helpers.CLIWRAP($STOP, '$STOP'),
  $STATIC_START: Helpers.CLIWRAP($STATIC_START, '$STATIC_START'),
  $SERVE: Helpers.CLIWRAP($SERVE, '$SERVE'),
  $RELEASE: Helpers.CLIWRAP($RELEASE, '$RELEASE'),
  $RELEASE_ALL: Helpers.CLIWRAP($RELEASE_ALL, '$RELEASE_ALL'),
  $INSTALL_LOCALLY: Helpers.CLIWRAP($INSTALL_LOCALLY, '$INSTALL_LOCALLY'),
  $BACKUP: Helpers.CLIWRAP($BACKUP, '$BACKUP'),
  $RELEASE_OBSCURED: Helpers.CLIWRAP($RELEASE_OBSCURED, '$RELEASE_OBSCURED'),
  //#endregion
};
