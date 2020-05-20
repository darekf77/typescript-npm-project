import * as _ from 'lodash';
import * as express from 'express';
import * as path from 'path';
import { TnpDB } from 'tnp-db';
import { Project } from '../../project';
import { config } from '../../config';
import { Helpers } from 'tnp-helpers';
import { Models } from 'tnp-models';
import chalk from 'chalk';

/**
 * THIS FUNCTION CAN'T BE RECURIVE
 * event in worksapce childs...
 */
export async function chainBuild(args: string) {
  const allowedLibs = [
    'angular-lib',
    'isomorphic-lib'
  ] as Models.libs.LibType[];

  let project = Project.Current;

  const firstArg = _.first(args.split(' '));
  if (project.isWorkspace) {
    let selectedChild = project.children.find(c => c.name === firstArg);
    if (!selectedChild) {
      selectedChild = project.children.find(c => {
        const ok = (firstArg.search(c.name) !== -1);
        if (ok) {
          args = args.replace(firstArg, c.name);
        };
        return ok;
      });
    }
    if (selectedChild) {
      project = selectedChild;
    }
  }

  project.removeFileByRelativePath(config.file.tnpEnvironment_json);

  if (project.typeIsNot(...allowedLibs)) {
    Helpers.error(`Command only for project types: ${allowedLibs.join(',')}`, false, true);
  }
  const orgArgs = args;
  if (project.isWorkspaceChildProject) {
    args += ` --forClient=${project.name}`;
  }

  let deps: Project[] = [];
  if (project.isWorkspaceChildProject) {
    resolveDeps(project, deps);
    deps = deps.reverse();
    deps = prepareDeps(deps);
  }
  deps.push(project);
  if (project.typeIs('angular-lib') && project.workspaceDependenciesServers.length > 0) {
    deps = deps.concat(project.workspaceDependenciesServers);
    // TODO handle deps of project.workspaceDependenciesServers
  }


  let index = 0;
  const buildedOK = [];
  while (index < deps.length) {
    // for (let index = 0; index < deps.length; index++) {
    const projDep = deps[index];

    const action = async (proj: Project, baseline = false) => {
      const command = `${config.frameworkName} bdw ${args} ${!global.hideLog ? '-verbose' : ''}`;
      Helpers.info(`

      Running command in ${baseline ? 'baseline' : ''} dependency "${proj.genericName}" : ${command}

      `);
      if (proj.isWorkspaceChildProject) {

        await proj.run(command, {
          output: true,
          prefix: chalk.bold(`${baseline ? '[baseline]' : ''}[${proj.name}]`)
        }).unitlOutputContains('Watching for file changes.',
          [
            'Command failed:',
            'Compilation error',
            'Error: Please compile your'
          ]);

      }
      // if (proj.isStandaloneProject) {
      //   proj.run(`${config.frameworkName} bd ${args}`).sync();
      // }
    };

    if (projDep.isSite && !buildedOK.includes(projDep.baseline)) {
      try {
        await action(projDep.baseline, true);
        buildedOK.push(projDep.baseline);
      } catch (error) {
        Helpers.pressKeyAndContinue(`Fix errors for baseline project ${projDep.baseline.genericName} and press ENTER to build again`);
        continue;
      }
    }
    if (!buildedOK.includes(projDep)) {
      try {
        await action(projDep);
        buildedOK.push(projDep);
      } catch (error) {
        Helpers.pressKeyAndContinue(`Fix errors for project ${projDep.genericName} and press ENTER to build again`);
        continue;
      }
    }
    index++;
  }
  if (project.typeIs('angular-lib')) {
    if (project.isWorkspaceChildProject) {
      await project.buildProcess.startForAppFromArgs(false, true, 'dist', orgArgs)
    }
    // if (project.isStandaloneProject) {
    //   const command = `${config.frameworkName} baw ${args}`
    //   await project.run(command, {
    //     output: true,
    //     prefix: chalk.bold(`[${project.name}]`)
    //   }).unitlOutputContains(': Compiled successfully.');
    // }
  }
}

export async function DEVB() {
  const command = 'tnp bdw ss-common-ui --forClient=ss-common-ui -verbose';
  await Project.Current.run(command, {
    output: true,
    prefix: chalk.bold(`[testowy prefix] `)
  }).unitlOutputContains('Watching for file changes.',
    [
      'Command failed:',
      'Compilation error'
    ]);
  process.exit(0)
}

/**
 * CHAIN BUILD
 */
const $BUILD = async (args) => {
  await chainBuild(args)
};

const $BUILDWATCH = async (args) => {
  await chainBuild(args)
};

async function $DEFAULT_BUILD(args) {
  const project = Project.Current;
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
    process.exit(0)
  }
}


const BUILD_DIST_WATCH = (args) => Project.Current.buildProcess.startForLibFromArgs(false, true, 'dist', args);
const BUILD_DIST_WATCH_ALL = async (args) => {
  args += ' --buildForAllClients';
  Project.Current.buildProcess.startForLibFromArgs(false, true, 'dist', args);
}
const BUILD_APP_WATCH = (args) => Project.Current.buildProcess.startForAppFromArgs(false, true, 'dist', args);
const BUILD_DIST = async (args) => {
  // console.log('AM FUCKING HEre',Project.Current.isGenerated)
  // process.exit(0)
  await Project.Current.buildProcess.startForLibFromArgs(false, false, 'dist', args);
};
const BUILD_DIST_ALL = async (args) => {
  // console.log('AM FUCKING HEre',Project.Current.isGenerated)
  // process.exit(0)
  args += ' --buildForAllClients';
  await Project.Current.buildProcess.startForLibFromArgs(false, false, 'dist', args);
};
const BUILD_BUNDLE = (args) => Project.Current.buildProcess.startForLibFromArgs(false, false, 'bundle', args);
const BUILD_BUNDLE_PROD = (args) => Project.Current.buildProcess.startForLibFromArgs(true, false, 'bundle', args);



const STATIC_BUILD = async (args) => {
  if (!Project.Current.isWorkspace) {
    Helpers.error(`Please use:
${chalk.gray(`$ ${config.frameworkName} static:build:lib`)}
or
${chalk.gray(`$ ${config.frameworkName} static:build:app`)}

inside workspace children.
    `, false, true)
  }
  const staticVersionOfProject = await Project.Current.StaticVersion()
  if (staticVersionOfProject) {
    await staticVersionOfProject.buildProcess.startForLib({ args, staticBuildAllowed: true });
  } else {
    Helpers.log(`No static version for project: ${Project.Current.name}`)
  }

}

const STATIC_BUILD_LIB = async (args) => {
  const staticVersionOfProject = await Project.Current.StaticVersion();
  if (staticVersionOfProject) {
    await staticVersionOfProject.buildProcess.startForLib({ args, staticBuildAllowed: true });
  } else {
    Helpers.log(`No static version for project: ${Project.Current.name}`)
  }

};

const STATIC_BUILD_PROD = async (args) => {
  const staticVersionOfProject = await Project.Current.StaticVersion();
  if (staticVersionOfProject) {
    await staticVersionOfProject.buildProcess.startForLib({ prod: true, args, staticBuildAllowed: true })
  } else {
    Helpers.log(`No static version for project: ${Project.Current.name}`)
  }

}

const STATIC_BUILD_LIB_PROD = async (args) => (await Project.Current.StaticVersion()).buildProcess
  .startForLib({ prod: true, args, staticBuildAllowed: true })

const STATIC_BUILD_APP = async (args) => (await Project.Current.StaticVersion()).buildProcess
  .startForApp({ args, staticBuildAllowed: true })

const STATIC_BUILD_APP_PROD = async (args) => (await Project.Current.StaticVersion()).buildProcess
  .startForApp({ prod: true, args, staticBuildAllowed: true })

const $SERVE = (args) => {
  let proj = Project.Current;
  if (!proj) {
    proj = Project.nearestTo(process.cwd());
  }
  if (proj && proj.isStandaloneProject) {
    if (!proj.env || !proj.env.config || !proj.env.config.build.options) {
      Helpers.error(`Please build your project first`, false, true);
    }
    const localUrl = `http://localhost:${8080}/${proj.name}/`;
    const app = express()
    const filesLocation = path.join(proj.location, config.folder.docs);
    const mainfestOverride = `/${proj.name}/${config.file.manifest_webmanifest}`;

    app.get(`/${proj.name}/*`, (req, res) => {
      // console.log(`path: "${req.path}"`)
      // console.log(`ORIG: "${req.originalUrl}"`)
      let filePath = req.originalUrl
        .replace(/\/$/, '')
        .replace(new RegExp(Helpers.escapeStringForRegEx(`/${proj.name}`)), '')
        .replace(new RegExp(Helpers.escapeStringForRegEx(`/${proj.name}`)), '') // QUICKFIX
        .replace(/^\//, '')
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
    })
    app.listen(8080, () => {
      console.log(`${config.frameworkName} standalone serve is runnning on: ${localUrl}`)
    });
  } else {
    const configServe: Models.dev.BuildServeArgsServe = require('minimist')(args.split(' '));
    if (!configServe.port && !configServe.baseUrl && !configServe.outDir) {
      Helpers.error(`Bad arguments for ${config.frameworkName} serve: ${configServe}`)
    }
    const app = express()
    app.use(configServe.baseUrl, express.static(path.join(process.cwd(), configServe.outDir)))
    app.listen(configServe.port, () => {
      console.log(`${config.frameworkName} serve is runnning on: http://localhost:${configServe.port}${configServe.baseUrl}

      Access project link: http://localhost:${proj.env.config.workspace.workspace.port}${configServe.baseUrl}

      `)
    });
  }

};


const $START = async (args) => {
  if (Project.Current.isStandaloneProject) {
    $SERVE(args);
    return;
  }
  if (!Project.Current.isWorkspace) {
    Helpers.error(`Please use this command only on workspace level`, false, true)
  }
  await Project.Current.start(args);
};

const SB = (args) => STATIC_BUILD(args);
const SBP = (args) => STATIC_BUILD_PROD(args);
const SBL = (args) => STATIC_BUILD_LIB(args);
const SBLP = (args) => STATIC_BUILD_LIB_PROD(args);
const SBA = (args) => STATIC_BUILD_APP(args);
const SBAP = (args) => STATIC_BUILD_APP_PROD(args);

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

const $BUILD_DIST_PROD = (args) => Project.Current.buildProcess.startForLibFromArgs(true, false, 'dist', args);
const $BUILD_BUNDLE_WATCH = (args) => Project.Current.buildProcess.startForLibFromArgs(false, true, 'bundle', args);
const $BUILD_BUNDLE_PROD = (args) => Project.Current.buildProcess.startForLibFromArgs(true, false, 'bundle', args);
const $BUILD_BUNDLE_PROD_WATCH = (args) => Project.Current.buildProcess.startForLibFromArgs(true, true, 'bundle', args);
const $BUILD_APP_PROD = (args) => Project.Current.buildProcess.startForAppFromArgs(true, false, 'dist', args);
const $BUILD_APP = (args) => Project.Current.buildProcess.startForAppFromArgs(false, false, 'dist', args);
const $BUILD_APP_WATCH_PROD = (args) => Project.Current.buildProcess.startForAppFromArgs(false, true, 'dist', args);
const $START_APP = async (args) => {
  await Project.Current.start(args);
};

function resolveDeps(proj: Project, deps: Project[]) {
  if (proj.workspaceDependencies.length > 0) {
    proj.workspaceDependencies.forEach(d => {
      if (_.isUndefined(deps.find(c => c.location === d.location))) {
        deps.push(d);
        resolveDeps(d, deps);
      }
    })
  }
}

function prepareDeps(deps: Project[]) {

  if (deps.length === 0) {
    return deps;
  }

  function swap(a: Project, b: Project) {
    const tmp = a;
    const bIndex = deps.indexOf(b);
    deps[deps.indexOf(a)] = b;
    deps[bIndex] = tmp;
  }

  while (true) {
    const depsArr = deps;
    for (let index = 0; index < depsArr.length; index++) {
      const proj = depsArr[index];
      const isSwapped = !_.isUndefined(depsArr.find(d => {
        const condit = proj.workspaceDependencies.includes(d) &&
          (depsArr.indexOf(d) > depsArr.indexOf(proj));
        if (condit) {
          swap(proj, d);
        }
        return condit;
      }));
      if (isSwapped) {
        break;
      }
      if (index === depsArr.length - 1) {
        return deps;
      }
    }
  }
}


const $BUILD_PROD = async (args) => {
  if (Project.Current.typeIs(...config.allowedTypes.libs)) {
    await Project.Current.buildProcess.startForLibFromArgs(true, false, 'dist', args);
  }
  if (Project.Current.typeIs(...config.allowedTypes.app)) {
    await Project.Current.buildProcess.startForAppFromArgs(true, false, 'dist', args);
  }
  process.exit(0);
};

const $STATIC_START = async (args) => $START(args);
const BUILD_LIB_WATCH = async (args) => BUILD_DIST_WATCH(args);

const $RELEASE = async (args) => {
  const argsObj: Models.dev.ReleaseOptions = require('minimist')(args.split(' '));
  argsObj.args = args;
  Project.Current.checkIfReadyForNpm();
  await Project.Current.release(argsObj)

  process.exit(0)
};

const $RELEASE_PROD = async (args) => {
  const argsObj: Models.dev.ReleaseOptions = require('minimist')(args.split(' '));
  argsObj.prod = true;
  argsObj.args = args;
  Project.Current.checkIfReadyForNpm();
  await Project.Current.release(argsObj)

  process.exit(0)
};
const BDW = (args) => BUILD_DIST_WATCH(args);
const BLW = (args) => BUILD_DIST_WATCH(args);
const $BAW = (args) => BUILD_APP_WATCH(args);

const $STOP_BUILD_DIST_WATCH = async (args) => {
  const db = await TnpDB.Instance(config.dbLocation);
  const projectLocation = Project.Current.location;
  await db.updateProcesses();
  const pidsToKill = db.getBuilds()
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
  Helpers.info('Done')
  process.exit(0);
};

async function $DB_BUILDS_UPDATE() {
  const db = await TnpDB.Instance(config.dbLocation);
  await db.updateProcesses();
  process.exit(0)
}




async function $ACTIVE_SINGULAR_BUILD(args) {
  await Project.Current.hasParentWithSingularBuild()
  // process.stdout.write();
  process.exit(0)
}


export default {
  DEVB: Helpers.CLIWRAP(DEVB, 'DEVB'),
  $BUILD: Helpers.CLIWRAP($BUILD, '$BUILD'),
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
  $STATIC_START: Helpers.CLIWRAP($STATIC_START, '$STATIC_START'),
  $SERVE: Helpers.CLIWRAP($SERVE, '$SERVE'),
  $RELEASE: Helpers.CLIWRAP($RELEASE, '$RELEASE'),
  $RELEASE_PROD: Helpers.CLIWRAP($RELEASE_PROD, '$RELEASE_PROD'),
};
