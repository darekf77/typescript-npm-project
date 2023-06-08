import { config } from 'tnp-config';
import { chalk, crossPlatformPath, path, _ } from 'tnp-core';
import { Helpers } from 'tnp-helpers';
import { Models } from 'tnp-models';
import { Project } from '../../project/abstract/project';

const $RELEASE_ALL = async (args: string) => {
  const all = `--all`
  await $RELEASE(args.replace(new RegExp(Helpers.escapeStringForRegEx(`--all`), 'g'), '') + ' ' + all);
};

const $RELEASE_TRUSTED = async (args: string) => {
  const trusted = `--trusted`;;
  const all = `--all`;
  await $RELEASE(
    args
      .replace(new RegExp(Helpers.escapeStringForRegEx(`--trusted`), 'g'), '')
      .replace(new RegExp(Helpers.escapeStringForRegEx(`--all`), 'g'), '')
    + ' ' + trusted + ' ' + all);
};

//#region RELEASE / NORMAL
const $RELEASE = async (args: string) => {

  //#region prepare relase args
  // Helpers.log(`ARR ARGS "${args}"`)
  const argsObj: Models.dev.ReleaseOptions = require('minimist')(args.split(' '));
  argsObj.args = args;
  if (!argsObj.releaseType) {
    argsObj.releaseType = 'patch';
  }

  if (!argsObj.trusted) {
    argsObj.trusted = false;
  }

  const specifiedVersion = argsObj.args
    .split(' ')
    .find(k => k.startsWith('v') && Number(k.replace('v', '')) >= 3) || '';

  Helpers.log(`argsObj.automaticRelease: ${argsObj.automaticRelease} `
    + `${specifiedVersion ? (' - only framework version = ' + specifiedVersion) : ''}`);

  const automaticRelease = !!argsObj.automaticRelease;
  if (automaticRelease) {
    global.tnpNonInteractive = true;
  }

  const automaticReleaseDocs = !!argsObj.automaticReleaseDocs;
  if (automaticReleaseDocs) {
    global.tnpNonInteractive = true;
  }
  // Helpers.log(`ARGS RELEASE

  // ${Helpers.stringify(argsObj)}

  // `)

  // const autoRelease = !!argsObj.auto;

  const proj = Project.Current as Project;

  if (!automaticRelease && automaticReleaseDocs && !proj.docsAppBuild.configExists) {
    Helpers.error(`To use command:  ${config.frameworkName} automatic:release:docs
    you have to build manulally your app first....

    Try:
    ${config.frameworkName} relase # by building docs app, you will save configuration for automatic build



    `, false, true)
  }

  if (proj.isSmartContainerChild) {
    Helpers.info(`Smart container not supported yet...`);
    process.exit(0);
  }


  if (!global.tnpNonInteractive) {
    Helpers.clearConsole();
  }


  /**
   * TODO this is not helpfull...
   */
  const lastReleaseProjFilePath = path.join(proj.location, 'tmp-last-released-proj')
  const lastReleaseProjContent = void 0; //  Helpers.readFile(lastReleaseProjFilePath); TODO QUICK_FIX
  const lastRelased = !!lastReleaseProjContent && Project.From(path.join(proj.location, lastReleaseProjContent))
  //  Helpers.cliTool.resolveChildProject(args, Project.Current) as Project;
  // Helpers.info(`
  // lastReleaseProjFilePath: ${lastReleaseProjFilePath}
  // lastRelased: ${lastRelased?.name}
  // `)
  if (!lastRelased) {
    Helpers.removeFileIfExists(lastReleaseProjFilePath);
  }

  const shouldReleaseLibMessage = async () => {
    if (automaticReleaseDocs) {
      return false;
    }
    let newVersion;
    if (argsObj.releaseType === 'major') {
      newVersion = proj.versionMajorPlusWithZeros
    } else if (argsObj.releaseType === 'minor') {
      newVersion = proj.versionMinorPlusWithZeros;
    } else if (argsObj.releaseType === 'patch') {
      newVersion = proj.versionPatchedPlusOne;
    }

    // TODO detecting changes for children when start container
    if (proj.isStandaloneProject) {
      const message = `Proceed with release of new version: ${newVersion} ?`;
      return await Helpers.questionYesNo(message);
    }

    if (proj.isSmartContainer) {
      Helpers.info(`Pacakges available for new version release:

${proj.children.map((c) => ` - @${proj.name}/${c.name} v${newVersion}`).join('\n')}
`);
      const message = 'Proceed with lib release ?';

      return await Helpers.questionYesNo(message);
    }

  }

  argsObj.shouldReleaseLibrary = await shouldReleaseLibMessage();

  if (argsObj.shouldReleaseLibrary) {
    if (argsObj.releaseType === 'major') {
      const newVersion = proj.versionMajorPlusWithZeros;
      proj.packageJson.data.version = newVersion;
      proj.packageJson.save(`${argsObj.releaseType} version up`);
    } else if (argsObj.releaseType === 'minor') {
      const newVersion = proj.versionMinorPlusWithZeros;
      proj.packageJson.data.version = newVersion;
      proj.packageJson.save(`${argsObj.releaseType} version up`);
    } else if (argsObj.releaseType === 'patch') {
      const newVersion = proj.versionPatchedPlusOne;
      proj.packageJson.data.version = newVersion;
      proj.packageJson.save(`${argsObj.releaseType} version up`);
    }
  }


  proj.packageJson.showDeps('Release');
  //#endregion

  if (proj.isContainer && !proj.isSmartContainer) {
    //#region container release
    let { resolved, commandString } = Helpers.cliTool.argsFromBegin<Project>(args, (a) => {
      return Project.From(path.join(proj.location, a));
    });
    args = commandString;

    resolved = resolved.filter(f => f.location !== proj.location);

    const forceReleaseAll = !!argsObj.all || (resolved.length > 0);

    const depsOfResolved = proj.projectsInOrderForChainBuild(resolved)
      .filter(d => d.name !== proj.name);

    const otherDeps = proj.children.filter(c => {
      return !depsOfResolved.includes(c);
    });

    let deps = [
      ...depsOfResolved,
      ...otherDeps,
    ];

    const depsOnlyToPush = [];

    const allTrusted = (Project.Current as Project).trustedAllPossible;

    //#region filter children
    for (let index = 0; index < deps.length; index++) {
      const child = deps[index];


      const lastBuildHash = child.packageJson.getBuildHash();
      const lastTagHash = child.git.lastTagHash();
      const sameHashes = (lastBuildHash === lastTagHash); // TODO QUICK FIX
      const versionIsOk = !!specifiedVersion ? child.frameworkVersionAtLeast(specifiedVersion as any) : true;

      const shouldRelease = (
        (!child.isSmartContainer && !child.isSmartContainerChild)
        && (argsObj.trusted ? allTrusted.includes(child.name) : true)
        && versionIsOk
        && !child.shouldBeOmmitedInRelease
        // && !child.isPrivate
        && !child.targetProjects.exists
        && (!sameHashes || forceReleaseAll)
      );
      Helpers.log(`ACTUALL RELEASE ${child.name}: ${shouldRelease}
      lastBuildHash: ${lastBuildHash}
      lastTagHash: ${lastTagHash}
      isPrivate: ${child.isPrivate}
      versionIsOk: ${versionIsOk}
      releaseAll: ${forceReleaseAll}
      sameHashes: ${sameHashes}
      `)

      if (!shouldRelease) {


        // Helpers.pressKeyAndContinue();
        // child.git.commit();
        // await child.git.pushCurrentBranch();

        depsOnlyToPush.push(child);
        deps[index] = void 0;
      }
    }
    deps = deps.filter(f => !!f);

    //#endregion





    //#region projs tempalte
    const projsTemplate = (child?: Project) => {
      return `

    PROJECTS FOR RELEASE CHAIN: ${specifiedVersion ? ('(only framework version = ' + specifiedVersion + ' )') : ''}

${deps
          .filter(p => {
            if (resolved.length > 0) {
              return depsOfResolved.includes(p)
            }
            return true;
          })
          .map((p, i) => {
            const bold = (child?.name === p.name);
            const index = i + 1;
            return `(${bold ? chalk.underline(chalk.bold(index.toString())) : index}. ${bold ? chalk.underline(chalk.bold(p.name)) : p.name})`;
          }).join(', ')}


${Helpers.terminalLine()}
processing...
    `;
    };
    //#endregion

    for (let index = 0; index < deps.length; index++) {

      const child = deps[index] as Project;

      Helpers.writeFile(lastReleaseProjFilePath, child.name);

      if (index === 0) {

        if (lastRelased && lastRelased.name !== child.name) {
          var startFromLast = (resolved.length === 0) && await Helpers.questionYesNo(`Start release from last project: ${chalk.bold(lastRelased.genericName)} ?`)
          if (!startFromLast) {
            Helpers.removeFileIfExists(lastReleaseProjFilePath);
          }
        }
        global.tnpNonInteractive = (resolved.length === 0);
        // Helpers.info(`
        // to relase
        // ${depsOfResolved.map((d, i) => i + '.' + d.name).join('\n')}
        // `)
        // Helpers.pressKeyAndContinue()
      }

      if (startFromLast) {
        if (child.name === lastRelased.name) {
          startFromLast = false;
        } else {
          continue;
        }
      }

      const exitBecouseNotInResolved = (
        resolved.length > 0
        && _.isUndefined(depsOfResolved.find(c => c.location === child.location))
      )
      // Helpers.info(`
      // depsOfResolved:
      //   ${depsOfResolved.map((d, i) => i + '.' + d.name).join('\n')}
      //   `)
      // Helpers.info(`exitBecouseNotInResolved (${child.name}) : ${exitBecouseNotInResolved}`)
      // Helpers.pressKeyAndContinue()
      if (exitBecouseNotInResolved) {
        continue;
      }

      Helpers.clearConsole();
      Helpers.info(projsTemplate(child));



      const init = async () => {
        while (true) {
          try {
            if (child.npmPackages.useSmartInstall) {
              child.node_modules.remove();
              child.smartNodeModules.install('install');
            }
            child.run(`${config.frameworkName} init`
              + ` --tnpNonInteractive=true ${global.hideLog ? '' : '-verbose'}`,
              { prefix: `[container ${chalk.bold(proj.name)} release]`, output: true }).sync();
            break;
          } catch (error) {
            Helpers.pressKeyAndContinue(`Please fix your project ${chalk.bold(child.name)} and try again..`);
          }
        }
      };


      // Helpers.pressKeyAndContinue(`press any key`);


      while (true) {
        await init();
        try {
          child.run(`${config.frameworkName} release ${!!specifiedVersion ? specifiedVersion : ''}`
            + ` --automaticRelease=${resolved.length === 0}`
            + ` --tnpNonInteractive=${resolved.length === 0}`
            + ` --releaseType=${argsObj.releaseType}`
            + ` ${global.hideLog ? '' : '-verbose'}`
            , { prefix: `[container ${chalk.bold(proj.name)}/${child.name} release]`, output: true }).sync();
          // await child.release(handleStandalone(child, {}), true);
          // Helpers.pressKeyAndContinue(`Release done`);
          break;
        } catch (error) {
          Helpers.pressKeyAndContinue(`Please fix your project ${chalk.bold(child.name)} and try again..`);
        }
      }

      // Helpers.pressKeyAndContinue(`Press any key to release ${chalk.bold(child.genericName)}`);

    }

    Helpers.removeFileIfExists(lastReleaseProjFilePath);
    Helpers.clearConsole();
    Helpers.info(projsTemplate());

    if (resolved.length === 0) {
      for (let index = 0; index < depsOnlyToPush.length; index++) {
        const depForPush = depsOnlyToPush[index] as Project;

        Helpers.warn(`

        No realase needed for ${chalk.bold(depForPush.name)} ..just initing and pushing to git...

        `); // hash in package.json to check

        if (depForPush.typeIs('angular-lib', 'isomorphic-lib') && depForPush.isSmartContainer) {
          try {
            await depForPush.filesStructure.init('')
          } catch (error) {
            Helpers.info(`Not able to init fully...`);
          }
        }

        depForPush.git.commit(`release push`);
        await depForPush.gitActions.push()
      }

      proj.git.commit(`Up4date after release`);
      await proj.gitActions.push();
      const tnpProj = (Project.Tnp as Project);
      tnpProj.git.commit(`Update after release`);
      await tnpProj.gitActions.push();
      Helpers.success(`


      R E L E A S E   O F   C O N T I A I N E R  ${chalk.bold(proj.genericName)}  D O N E


      `);
    } else {
      Helpers.success(`


      P A R T I A L  R E L E A S E   O F   C O N T I A I N E R  ${chalk.bold(proj.genericName)}  D O N E


      `);
    }

    process.exit(0);

    //#endregion
  } else {
    //#region standalone project release
    if (proj.targetProjects.exists) {
      await proj.targetProjects.update();
      process.exit(0);
    } else {
      if (!proj.node_modules.exist) {
        proj.npmPackages.installFromArgs('');
      }
      await proj.release(handleStandaloneOrSmartContainer(proj, argsObj));
      process.exit(0);
    }
    //#endregion
  }

};

const $RELEASE_MAJOR = async (args: string) => {
  args = (args || '') + ' --releaseType=major';
  return await $RELEASE(args);
}

const $MAJOR = async (args: string) => {
  args = (args || '') + ' --releaseType=major';
  return await $RELEASE(args);
}

const $RELEASE_MINOR = async (args: string) => {
  args = (args || '') + ' --releaseType=minor';
  return await $RELEASE(args);
}

const $MAJOR_RELEASE = async (args: string) => {
  return await $RELEASE_MAJOR(args);
};

const $MINOR_RELEASE = async (args: string) => {
  return await $RELEASE_MINOR(args);
};

const $MINOR = async (args: string) => {
  return await $RELEASE_MINOR(args);
};


const SET_MINOR_VER = async (args: string) => {
  const argsObj: { trusted } = require('minimist')(args.split(' '));
  let children = (Project.Current.children as Project[]);

  // if (argsObj.trusted) {
  args = args.replace('--trusted', '')
  args = args.replace('true', '')
  const all = (Project.Current as Project).trustedAllPossible;
  // console.log({
  //   all
  // })
  children = children.filter(c => all.includes(c.name));
  // }

  for (let index = 0; index < children.length; index++) {
    const child = children[index] as Project;
    Helpers.taskStarted(`Updating version for ${child.name}@${child.packageJson.data.version} ... `);
    await child.setMinorVersion(Number(args.trim()));
    Helpers.taskDone();
  }
  process.exit(0)
}

const SET_MAJOR_VER = async (args: string) => {
  const argsObj: { trusted } = require('minimist')(args.split(' '));
  let children = (Project.Current.children as Project[]);

  // if (argsObj.trusted) {
  args = args.replace('--trusted', '')
  args = args.replace('true', '')
  const all = (Project.Current as Project).trustedAllPossible;
  // console.log({
  //   all
  // })
  children = children.filter(c => all.includes(c.name));
  // }

  for (let index = 0; index < children.length; index++) {
    const child = children[index] as Project;
    Helpers.taskStarted(`Updating version for ${child.name}@${child.packageJson.data.version} ... `);
    await child.setMajorVersion(Number(args.trim()));
    Helpers.taskDone();
  }
  process.exit(0)
}


function handleStandaloneOrSmartContainer(proj: Project, argsObj: any) {
  if (proj.packageJson.libReleaseOptions.obscure) {
    argsObj.obscure = true;
  }
  if (proj.packageJson.libReleaseOptions.ugly) {
    argsObj.uglify = true;
  }
  if (proj.packageJson.libReleaseOptions.nodts) {
    argsObj.nodts = true;
  }
  if (proj.packageJson.libReleaseOptions.includeNodeModules) {
    argsObj.includeNodeModules = true;
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

const $AUTO_RELEASE = async (args) => {
  const auto = `--automaticRelease`
  await $RELEASE(args + ' ' + auto);
};

const $AUTO_RELEASE_DOCS = async (args) => {
  const auto = `--automaticReleaseDocs`
  await $RELEASE(args + ' ' + auto);
};

export default {
  SET_MINOR_VER: Helpers.CLIWRAP(SET_MINOR_VER, 'SET_MINOR_VER'),
  SET_MAJOR_VER: Helpers.CLIWRAP(SET_MAJOR_VER, 'SET_MAJOR_VER'),
  $AUTO_RELEASE: Helpers.CLIWRAP($AUTO_RELEASE, '$AUTO_RELEASE'),
  $AUTO_RELEASE_DOCS: Helpers.CLIWRAP($AUTO_RELEASE_DOCS, '$AUTO_RELEASE_DOCS'),
  $RELEASE: Helpers.CLIWRAP($RELEASE, '$RELEASE'),
  $RELEASE_TRUSTED: Helpers.CLIWRAP($RELEASE_TRUSTED, '$RELEASE_TRUSTED'),
  $RELEASE_MAJOR: Helpers.CLIWRAP($RELEASE_MAJOR, '$RELEASE_MAJOR'),
  $MAJOR_RELEASE: Helpers.CLIWRAP($MAJOR_RELEASE, '$MAJOR_RELEASE'),
  $RELEASE_MINOR: Helpers.CLIWRAP($RELEASE_MINOR, '$RELEASE_MINOR'),
  $MINOR: Helpers.CLIWRAP($MINOR, '$MINOR'),
  $MAJOR: Helpers.CLIWRAP($MAJOR, '$MAJOR'),
  $MINOR_RELEASE: Helpers.CLIWRAP($MINOR_RELEASE, '$MINOR_RELEASE'),
  $RELEASE_ALL: Helpers.CLIWRAP($RELEASE_ALL, '$RELEASE_ALL'),
  $RELEASE_OBSCURED: Helpers.CLIWRAP($RELEASE_OBSCURED, '$RELEASE_OBSCURED'),
}
