
import { config } from "tnp-config";
import { chalk, path, _ } from "tnp-core";
import { Helpers } from "tnp-helpers";
import { Models } from "tnp-models";
import { Project } from "../../project/abstract/project";

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
  if (!argsObj.releaseType) {
    argsObj.releaseType = 'patch';
  }

  Helpers.log(`argsObj.automaticRelease: ${argsObj.automaticRelease}`)
  const automaticRelease = !!argsObj.automaticRelease;
  if (automaticRelease) {
    global.tnpNonInteractive = true;
  }
  // Helpers.log(`ARGS RELEASE

  // ${Helpers.stringify(argsObj)}

  // `)

  // const autoRelease = !!argsObj.auto;

  const proj = Project.Current as Project;
  const lastReleaseProjFilePath = path.join(proj.location, 'tmp-last-released-proj')
  const lastReleaseProjContent = Helpers.readFile(lastReleaseProjFilePath);
  const lastRelased = !!lastReleaseProjContent && Project.From(path.join(proj.location, lastReleaseProjContent))
  //  Helpers.cliTool.resolveChildProject(args, Project.Current) as Project;
  // Helpers.info(`
  // lastReleaseProjFilePath: ${lastReleaseProjFilePath}
  // lastRelased: ${lastRelased?.name}
  // `)
  if (!lastRelased) {
    Helpers.removeFileIfExists(lastReleaseProjFilePath);
  }

  if (argsObj.releaseType === 'major') {
    const newVersion = proj.versionMajorPlusWithZeros;
    proj.packageJson.data.version = newVersion;
    proj.packageJson.save(`Major version up`);
  }

  proj.packageJson.showDeps('Release');
  //#endregion

  if (proj.isContainer) {
    //#region container release
    const { resolved, commandString } = Helpers.cliTool.argsFromBegin<Project>(args, (a) => {
      return Project.From(path.join(proj.location, a));
    });
    args = commandString;

    const forceReleaseAll = !!argsObj.all || (resolved.length > 0);

    const depsOfResolved = proj.projectsInOrderForChainBuild(resolved)
      .filter(d => d.name !== proj.name && !d.isPrivate);

    const otherDeps = proj.children.filter(c => {
      return !depsOfResolved.includes(c);
    });

    const deps = [
      ...depsOfResolved,
      ...otherDeps,
    ];

    const depsOnlyToPush = proj.children.filter(c => {
      return !deps.includes(c);
    });

    //#region projs tempalte
    const projsTemplate = (child?: Project) => {
      return `

    PROJECTS FOR RELEASE CHAIN:

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

      const lastBuildHash = child.packageJson.getBuildHash();
      const lastTagHash = child.git.lastTagHash();
      const sameHashes = (lastBuildHash === lastTagHash); // TODO QUICK FIX


      const init = async () => {
        while (true) {
          try {
            child.run(`${config.frameworkName} init`
              + ` --tnpNonInteractive=true ${global.hideLog ? '' : '-verbose'}`,
              { prefix: `[container ${chalk.bold(proj.name)} release]`, output: true }).sync();
            break;
          } catch (error) {
            Helpers.pressKeyAndContinue(`Please fix your project ${chalk.bold(child.name)} and try again..`);
          }
        }
      };

      const shouldRelease = (
        !child.isPrivate
        && !child.targetProjects.exists
        && (!sameHashes || forceReleaseAll)
      );
      Helpers.log(`ACTUALL RELEASE: ${shouldRelease}

      releaseAll: ${forceReleaseAll}
      sameHashes: ${sameHashes}
      `)
      // Helpers.pressKeyAndContinue(`press any key`);

      if (shouldRelease) {
        while (true) {
          await init();
          try {
            child.run(`${config.frameworkName} release `
              + ` --automaticRelease=${resolved.length === 0}`
              + ` --tnpNonInteractive=${resolved.length === 0}`
              + ` ${global.hideLog ? '' : '-verbose'}`
              , { prefix: `[container ${chalk.bold(proj.name)}/${child.name} release]`, output: true }).sync();
            // await child.release(handleStandalone(child, {}), true);
            // Helpers.pressKeyAndContinue(`Release done`);
            break;
          } catch (error) {
            Helpers.pressKeyAndContinue(`Please fix your project ${chalk.bold(child.name)} and try again..`);
          }
        }
      } else {
        Helpers.warn(`

        No realase needed for ${chalk.bold(child.name)} ..just initing and pushing to git...

        `); // hash in package.json to check

        if (child.typeIs('angular-lib', 'isomorphic-lib')) {
          try {
            await child.filesStructure.init('')
          } catch (error) {
            Helpers.info(`Not able to init fully...`);
          }
        }

        // Helpers.pressKeyAndContinue();
        child.git.commit();
        await child.git.pushCurrentBranch();
      }
      // Helpers.pressKeyAndContinue(`Press any key to release ${chalk.bold(child.genericName)}`);

    }

    Helpers.removeFileIfExists(lastReleaseProjFilePath);
    Helpers.clearConsole();
    Helpers.info(projsTemplate());

    if (resolved.length === 0) {
      for (let index = 0; index < depsOnlyToPush.length; index++) {
        const depForPush = depsOnlyToPush[index];
        depForPush.git.commit(`release push`);
        await depForPush.git.pullCurrentBranch()
      }

      proj.git.commit(`Up4date after release`);
      await proj.git.pushCurrentBranch();
      Project.Tnp.git.commit(`Update after release`);
      await Project.Tnp.git.pushCurrentBranch();
      Helpers.info(`


      R E L E A S E   O F   C O N T I A I N E R  ${chalk.bold(proj.genericName)}  D O N E


      `);
    } else {
      Helpers.info(`


      P A R T I A L  R E L E A S E   O F   C O N T I A I N E R  ${chalk.bold(proj.genericName)}  D O N E


      `);
    }

    process.exit(0);

    //#endregion
  } else {
    //#region standalone project release

    await proj.release(handleStandalone(proj, argsObj), automaticRelease);
    //#endregion
  }
  process.exit(0);
};

const $RELEASE_MAJOR = async (args: string) => {
  args = (args || '') + ' --releaseType=major';
  return await $RELEASE(args);
}

const $MAJOR_RELEASE = async (args: string) => {
  return await $RELEASE_MAJOR(args);
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

const $AUTO_RELEASE = async (args) => {
  const auto = `--automaticRelease`
  await $RELEASE(args.replace(new RegExp(Helpers.escapeStringForRegEx(`--all`), 'g'), '') + ' ' + auto);
};

export default {
  $AUTO_RELEASE: Helpers.CLIWRAP($AUTO_RELEASE, '$AUTO_RELEASE'),
  $RELEASE: Helpers.CLIWRAP($RELEASE, '$RELEASE'),
  $RELEASE_MAJOR: Helpers.CLIWRAP($RELEASE_MAJOR, '$RELEASE_MAJOR'),
  $MAJOR_RELEASE: Helpers.CLIWRAP($MAJOR_RELEASE, '$MAJOR_RELEASE'),
  $RELEASE_ALL: Helpers.CLIWRAP($RELEASE_ALL, '$RELEASE_ALL'),
  $RELEASE_OBSCURED: Helpers.CLIWRAP($RELEASE_OBSCURED, '$RELEASE_OBSCURED'),
}
