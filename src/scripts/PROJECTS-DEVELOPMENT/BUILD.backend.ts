import * as _ from 'lodash';
import * as express from 'express';
import * as path from 'path';
import { TnpDB } from 'tnp-db';
import { Project } from '../../project';
import { config } from '../../config';
import { Helpers } from 'tnp-helpers';
import { Models } from 'tnp-models';
import chalk from 'chalk';
import { EnvironmentConfig } from '../../project/features';

/**
 * THIS FUNCTION CAN'T BE RECURIVE
 * event in worksapce childs...
 */
export async function chainBuild(args: string) {
  const allowedLibs = [
    'angular-lib',
    'isomorphic-lib'
  ] as Models.libs.LibType[];

  let project = (Project.Current as Project);

  const firstArg = _.first(args.split(' '));
  if (project.isWorkspace || project.isWorkspace) {
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

  await Helpers.compilationWrapper(async () => {
    project.removeFileByRelativePath(config.file.tnpEnvironment_json);
    await (project.env as any as EnvironmentConfig).init(args);
  }, `Reiniting environment for chaing build...`);


  if (project.typeIsNot(...allowedLibs)) {
    Helpers.error(`Command only for project types: ${allowedLibs.join(',')}`, false, true);
  }
  const orgArgs = args;
  if (project.isWorkspaceChildProject) {
    args += ` --forClient=${project.name}`;
  }

  let deps: Project[] = project.isStandaloneProject ? [project] : project.projectsInOrderForChainBuild();

  const baselineProjects = [];

  if (project.isSite) {
    const depsWithBaseline = [];
    deps.forEach(d => {
      if (!!d.baseline) {
        depsWithBaseline.push(d.baseline);
        baselineProjects.push(d.baseline)
      }
      depsWithBaseline.push(d);
    });
    deps = depsWithBaseline;
  }

  Helpers.info(`

  CHAIN BUILD PLAN:
${deps.map((d, i) => (i + 1) + '. ' + d.genericName).join('\n')}

  `)

  let index = 0;
  const buildedOK = [];

  if (project.isStandaloneProject) {
    args += ` --skipCopyToSelection true`;
    const copytoPathes = await project.selectProjectToCopyTO();
    if (copytoPathes.length > 0) {
      copytoPathes.forEach(pathToPorjectToCopy => {
        args += ` --copyto=${pathToPorjectToCopy}`;
      });
    }
  }

  while (index < deps.length) {
    // for (let index = 0; index < deps.length; index++) {
    const projDep = deps[index];

    const action = async (proj: Project) => {
      const isBaselineForThisBuild = baselineProjects.includes(proj);
      let argsForProjct = args;
      const watchModeAvailable = await proj.compilerCache.isWatchModeAllowed;
      if (watchModeAvailable) {
        Helpers.info(`[chainbuild] watch mode added for ${proj.name}`);
        argsForProjct += ` --watchOnly`;
      } else {
        Helpers.info(`[chainbuild] full compilation needed for ${proj.name}`);
      }

      const command = `${config.frameworkName} bdw ${argsForProjct} `
        + ` ${!project.isStandaloneProject ? '--tnpNonInteractive' : ''}`
        + ` ${!global.hideLog ? '-verbose' : ''}`
        + ` ${isBaselineForThisBuild ? '--skipBuild=true' : ''}`
        ;
      Helpers.info(`

      Running command in ${isBaselineForThisBuild ? 'baseline' : ''} dependency "${proj.genericName}" : ${command}

      `);
      if (proj.isWorkspaceChildProject || proj.isStandaloneProject) {

        await proj.run(command, {
          output: true,
          prefix: chalk.bold(`${isBaselineForThisBuild ? '[baseline]' : ''}[${proj.name}]`)
        }).unitlOutputContains(isBaselineForThisBuild ?
          'Skip build for ' :
          [
            'Waching files.. started.. please wait',
            'No need to copying on build finsh', // angular lib,
            'Build steps ended...',
          ]
          ,
          [
            'Error: Command failed',
            ': error ',
            'Command failed:',
            'Compilation error',
            'Error: Please compile your'
          ]);

      }
      // if (proj.isStandaloneProject) {
      //   proj.run(`${config.frameworkName} bd ${args}`).sync();
      // }
    };

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

  await project.buildProcess.startForAppFromArgs(false, true, 'dist', orgArgs);

}

export async function DEVB() {
  const command = 'tnp bdw ss-common-ui --forClient=ss-common-ui -verbose';
  await (Project.Current as Project).run(command, {
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
    process.exit(0)
  }
}


const BUILD_DIST_WATCH = (args) => (Project.Current as Project).buildProcess.startForLibFromArgs(false, true, 'dist', args);
const BUILD_DIST_WATCH_ALL = async (args) => {
  args += ' --buildForAllClients';
  (Project.Current as Project).buildProcess.startForLibFromArgs(false, true, 'dist', args);
}
const BUILD_APP_WATCH = (args) => (Project.Current as Project).buildProcess.startForAppFromArgs(false, true, 'dist', args);
const BUILD_DIST = async (args) => {
  // console.log('AM FUCKING HEre',(Project.Current as Project).isGenerated)
  // process.exit(0)
  await (Project.Current as Project).buildProcess.startForLibFromArgs(false, false, 'dist', args);
};
const BUILD_DIST_ALL = async (args) => {
  // console.log('AM FUCKING HEre',(Project.Current as Project).isGenerated)
  // process.exit(0)
  args += ' --buildForAllClients';
  await (Project.Current as Project).buildProcess.startForLibFromArgs(false, false, 'dist', args);
};
const BUILD_BUNDLE = (args) => (Project.Current as Project).buildProcess.startForLibFromArgs(false, false, 'bundle', args);
const BUILD_BUNDLE_PROD = (args) => (Project.Current as Project).buildProcess.startForLibFromArgs(true, false, 'bundle', args);



const STATIC_BUILD = async (args) => {
  if (!(Project.Current as Project).isWorkspace) {
    Helpers.error(`Please use:
${chalk.gray(`$ ${config.frameworkName} static:build:lib`)}
or
${chalk.gray(`$ ${config.frameworkName} static:build:app`)}

inside workspace children.
    `, false, true)
  }
  const staticVersionOfProject = await (Project.Current as Project).StaticVersion()
  if (staticVersionOfProject) {
    await staticVersionOfProject.buildProcess.startForLib({ args, staticBuildAllowed: true });
  } else {
    Helpers.log(`No static version for project: ${(Project.Current as Project).name}`)
  }

}

const STATIC_BUILD_LIB = async (args) => {
  const staticVersionOfProject = await (Project.Current as Project).StaticVersion();
  if (staticVersionOfProject) {
    await staticVersionOfProject.buildProcess.startForLib({ args, staticBuildAllowed: true });
  } else {
    Helpers.log(`No static version for project: ${(Project.Current as Project).name}`)
  }

};

const STATIC_BUILD_PROD = async (args) => {
  const staticVersionOfProject = await (Project.Current as Project).StaticVersion();
  if (staticVersionOfProject) {
    await staticVersionOfProject.buildProcess.startForLib({ prod: true, args, staticBuildAllowed: true })
  } else {
    Helpers.log(`No static version for project: ${(Project.Current as Project).name}`)
  }

}

const STATIC_BUILD_LIB_PROD = async (args) => (await (Project.Current as Project).StaticVersion()).buildProcess
  .startForLib({ prod: true, args, staticBuildAllowed: true })

const STATIC_BUILD_APP = async (args) => (await (Project.Current as Project).StaticVersion()).buildProcess
  .startForApp({ args, staticBuildAllowed: true })

const STATIC_BUILD_APP_PROD = async (args) => (await (Project.Current as Project).StaticVersion()).buildProcess
  .startForApp({ prod: true, args, staticBuildAllowed: true })

const $SERVE = async (args) => {
  let proj = (Project.Current as Project);
  if (!proj) {
    proj = Project.nearestTo<Project>(process.cwd());
  }
  if (proj && proj.isStandaloneProject) {
    if (!proj.env || !proj.env.config || !proj.env.config.build.options) {
      Helpers.error(`Please build your project first`, false, true);
    }
    if (proj.typeIs('angular-lib')) {
      //#region serve angular lib
      const localUrl = `http://localhost:${8080}/${proj.name}/`;
      const app = express()
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
      //#endregion
    }
    if (proj.typeIs('isomorphic-lib')) {
      await proj.start(args);
    }

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
  if ((Project.Current as Project).isStandaloneProject) {
    await $SERVE(args);
    return;
  }
  if (!(Project.Current as Project).isWorkspace) {
    Helpers.error(`Please use this command only on workspace level`, false, true)
  }
  await (Project.Current as Project).start(args);
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

const $STATIC_START = async (args) => $START(args);
const BUILD_LIB_WATCH = async (args) => BUILD_DIST_WATCH(args);

const $RELEASE = async (args) => {
  const argsObj: Models.dev.ReleaseOptions = require('minimist')(args.split(' '));
  argsObj.args = args;
  const proj = (Project.Current as Project);
  proj.checkIfReadyForNpm();
  if(proj.packageJson.libReleaseOptions.obscure) {
    argsObj.obscure = true;
  }
  if(proj.packageJson.libReleaseOptions.ugly) {
    argsObj.uglify = true;
  }
  if(proj.packageJson.libReleaseOptions.nodts) {
    argsObj.nodts = true;
  }
  await proj.release(argsObj)

  process.exit(0)
};

const $RELEASE_OBSCURED = async (args) => {
  const argsObj: Models.dev.ReleaseOptions = require('minimist')(args.split(' '));
  argsObj.obscure = true;
  argsObj.uglify = true;
  argsObj.prod = true;
  argsObj.args = args;
  (Project.Current as Project).checkIfReadyForNpm();
  await (Project.Current as Project).release(argsObj)

  process.exit(0)
};

const BDW = (args) => BUILD_DIST_WATCH(args);
const BLW = (args) => BUILD_DIST_WATCH(args);
const $BAW = (args) => BUILD_APP_WATCH(args);

async function $BUILD_DOCS(args) {
  if ((Project.Current as Project).isStandaloneProject) {
    await (Project.Current as Project).filesStructure.init('');
    await (Project.Current as Project).buildProcess.startForAppFromArgs(false, false, 'dist', args);
  }
  process.exit(0)
}

async function $BUILD_DOCS_PROD(args) {
  if ((Project.Current as Project).isStandaloneProject) {
    await (Project.Current as Project).filesStructure.init('');
    await (Project.Current as Project).buildProcess.startForAppFromArgs(true, false, 'dist', args);
  }
  process.exit(0)
}

const $STOP_BUILD_DIST_WATCH = async (args) => {
  const db = await TnpDB.Instance(config.dbLocation);
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
  Helpers.info('Done')
  process.exit(0);
};

async function $DB_BUILDS_UPDATE() {
  const db = await TnpDB.Instance(config.dbLocation);
  await db.updateProcesses();
  process.exit(0)
}




async function $ACTIVE_SINGULAR_BUILD(args) {
  await (Project.Current as Project).hasParentWithSingularBuild()
  // process.stdout.write();
  process.exit(0)
}


export default {
  $BUILD_DOCS: Helpers.CLIWRAP($BUILD_DOCS, '$BUILD_DOCS'),
  $BUILD_DOCS_PROD: Helpers.CLIWRAP($BUILD_DOCS_PROD, '$BUILD_DOCS_PROD'),
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
  $RELEASE_OBSCURED: Helpers.CLIWRAP($RELEASE_OBSCURED, '$RELEASE_OBSCURED'),
};
