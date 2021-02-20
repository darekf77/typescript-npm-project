import * as _ from 'lodash';
import { Models } from 'tnp-models';
import { Project } from '../../project';
import { Helpers } from 'tnp-helpers';
import { config, ConfigModels } from 'tnp-config';
import { EnvironmentConfig } from '../../project/features/environment-config';
import chalk from 'chalk';

/**
 * THIS FUNCTION CAN'T BE RECURIVE
 * event in worksapce childs...
 */
export async function chainBuild(args: string) {
  const allowedLibs = [
    'angular-lib',
    'isomorphic-lib',
    'docker',
  ] as ConfigModels.LibType[];

  let project = (Project.Current as Project);

  if (project.isContainer) {

  } else {
    //#region chain build for workspace
    const firstArg = _.first(args.split(' '));
    if (project.isWorkspace || project.isContainer) {
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
    //#endregion
  }

  var orgArgs = args;
  if (project.isWorkspaceChildProject) {
    args += ` --forClient=${project.name}`;
  }

  let deps: Project[] = [];
  const copyto: { [projectLocation: string]: Project[]; } = {};

  if (project.isStandaloneProject) {
    deps = [project];
  } else if (project.isContainer) {
    const standaloneProjects = project.projectsFromArgs(args, (newArgs) => {
      args = newArgs;
    });
    deps = standaloneProjects.map(p => {
      copyto[p.project.location] = p.copyto;
      return p.project;
    });
  } else {
    deps = project.projectsInOrderForChainBuild();
  }

  const baselineProjects = [];

  if (project.isSite) {
    //#region handle site
    const depsWithBaseline = [];
    deps.forEach(d => {
      if (!!d.baseline) {
        depsWithBaseline.push(d.baseline);
        baselineProjects.push(d.baseline)
      }
      depsWithBaseline.push(d);
    });
    deps = depsWithBaseline;
    //#endregion
  }

  Helpers.info(`

  CHAIN BUILD PLAN:
${deps.map((d, i) => {
    const s = _.isArray(copyto[d.location]) ? ` copy to: ${
      (copyto[d.location].length === 0) ? '-' : copyto[d.location]
        .map(p => chalk.italic(p.name)
          // + '(' + p.location + ')'
        ).join(', ')
      }` : '';
    return (i + 1) + '. ' + chalk.bold(d.genericName) + s;
  }).join('\n')}

  `)

  let index = 0;
  const buildedOK = [];

  if (project.isStandaloneProject && !project.isDocker) {
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
        + (_.isArray(copyto[proj.location]) ?
          copyto[proj.location].map(p => ` --copyto=${p.location} `).join(' ')
          : '')
        ;
      Helpers.info(`

      Running command in ${isBaselineForThisBuild ? 'baseline' : ''} dependency "${chalk.bold(proj.genericName)}" : ${command}

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

  if (!project.isContainer) {
    await project.buildProcess.startForAppFromArgs(false, true, 'dist', orgArgs);
  }
}
