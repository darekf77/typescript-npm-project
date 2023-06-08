import { crossPlatformPath, _ } from 'tnp-core';
import { path } from 'tnp-core'
import { fse } from 'tnp-core'

import { JSON10 } from 'json10';
import { config, ConfigModels } from 'tnp-config';
import { Models } from 'tnp-models';
import { Helpers } from 'tnp-helpers';
import { Project } from '../../project/abstract/project/project';
import { CLI } from 'tnp-cli';
import { notAllowedProjectNames } from '../../constants';

//#region site option
export type NewSiteOptions = {
  type?: ConfigModels.NewFactoryType,
  name?: string,
  cwd?: string,
  basedOn?: string,
  version?: ConfigModels.FrameworkVersion,
  skipInit?: boolean;
  alsoBasedOn?: string[];
  siteProjectMode?: 'strict' | 'dependency';
};
//#endregion

export class ProjectFactory {
  //#region singleton
  private static _instance: ProjectFactory;
  public static get Instance() {
    if (!this._instance) {
      this._instance = new ProjectFactory();
    }
    return this._instance;
  }
  //#endregion

  //#region error messages
  private errorMsgCreateProject() {
    Helpers.log(CLI.chalk.green(`Good examples:`));
    config.projectTypes.forNpmLibs.forEach(t => {
      Helpers.log(`\t${CLI.chalk.gray(`${config.frameworkName} new`)} ${CLI.chalk.black(t)} ${CLI.chalk.gray('mySuperLib')}`);
    });
    Helpers.error(CLI.chalk.red(`Please use example above.`), false, true);
  }
  //#endregion

  //#region fix options
  private fixOptions_create(options: NewSiteOptions) {
    if (_.isNil(options)) {
      options = {} as any;
    }

    if (_.isNil(options.version)) {
      options.version = config.defaultFrameworkVersion; // OK
    }

    if (_.isNil(options.skipInit)) {
      options.skipInit = true;
    }

    if (!_.isArray(options.alsoBasedOn)) {
      options.alsoBasedOn = []
    }

    return options;
  }
  //#endregion

  //#region create models
  public createModelFromArgs(args: string, exit = true, cwd: string) {
    const argv = args.split(' ');
    const name = argv[1]
    const relativePath = argv[2]
    Project.From<Project>(cwd).filesFactory.createModel(relativePath, name);
    if (exit) {
      process.exit(0)
    }
  }
  //#endregion

  //#region container / standalone
  public async containerStandaloneFromArgs(args: string, exit = true, cwd: string) {
    const argv = args.split(' ');

    if (!_.isArray(argv) || argv.length < 1) {
      Helpers.error(`Top few argument for ${CLI.chalk.black('init')} parameter.`, true);
      this.errorMsgCreateProject()
    }
    const { basedOn, version, skipInit }: {
      basedOn: string;
      version: ConfigModels.FrameworkVersion;
      skipInit?: boolean
    } = require('minimist')(args.split(' '));


    // if (basedOn) {
    //   Helpers.error(`To create workspace site use command: `
    //     + `${config.frameworkName} new: site name - of - workspace - site`
    //     + `--basedOn relativePathToBaselineWorkspace`, false, true);
    // }
    const type = 'isomorphic-lib' as any;
    const name = argv[0];

    await this.createContainersOrStandalone({
      type,
      name,
      cwd,
      basedOn: void 0,
      version: (_.isString(version) && version.length <= 5 && version.startsWith('v')) ? version : void 0,
      skipInit
    });

    if (exit) {
      process.exit(0)
    }

  }
  //#endregion

  //#region add remote to standalone
  private addRemoteToStandalone(appProj: Project) {
    if (appProj.isStandaloneProject && !appProj.isSmartContainerChild) {
      const lastContainer = appProj.parent;
      const ADDRESS_GITHUB_SSH_PARENT = lastContainer?.git?.originURL;
      const newRemote = ADDRESS_GITHUB_SSH_PARENT?.replace(`${lastContainer.name}.git`, `${appProj.name}.git`);
      if (newRemote) {
        appProj.run('git remote add origin ' + newRemote).sync();
      }
      appProj.run('git add --all . && git commit -m "first"').sync();
    }
  }
  //#endregion

  //#region init containers
  private async initContainersAndApps(cwd: string, nameFromArgs: string, version: ConfigModels.FrameworkVersion) {

    const containersAndProjFromArgName = !nameFromArgs.includes('/') ? nameFromArgs.replace('\\', '/').split('/') : [];
    const hasContainersFromArgs = (containersAndProjFromArgName.length > 1);
    const projName = hasContainersFromArgs ? _.last(containersAndProjFromArgName) : _.first(containersAndProjFromArgName);
    if (notAllowedProjectNames.includes(projName)) {
      Helpers.error(`

      Name ${CLI.chalk.bold(projName)} is not allowed.

      Use different name: ${CLI.chalk.bold(containersAndProjFromArgName.join('/').replace('app', 'my-app-or-something-else'))}

      `, false, true);
    }

    let firstContainer: Project;
    let lastContainer: Project;
    let lastIsBrandNew = false;
    let lastSmart = false;

    const grandpa = Project.From(cwd) as Project;
    const containers: Project[] = [
      ...((grandpa && grandpa.isContainer) ? [grandpa] : []),
    ];

    if (hasContainersFromArgs) {
      const foldersToRecreate = _.cloneDeep(containersAndProjFromArgName).slice(0, containersAndProjFromArgName.length - 1);
      let tmpCwd = cwd;
      let parentContainer = Project.From(cwd) as Project;
      let currentContainer: Project;
      do {
        const folder = foldersToRecreate.shift();
        const isLastContainer = (foldersToRecreate.length === 0)
        const currentContainerPath = path.join(tmpCwd, folder);
        // console.log(`

        // RUN for ${currentContainerPath}

        // `)
        const isBrandNew = !Helpers.exists(currentContainerPath);
        if (isBrandNew) {
          Helpers.mkdirp(currentContainerPath);
        }
        const packageJsonPath = path.join(currentContainerPath, config.file.package_json);

        let smart = false;
        let monorepo = false;
        if (!Helpers.exists(packageJsonPath)) {
          if (isLastContainer && isBrandNew && (!parentContainer || !parentContainer.isSmartContainer)) {
            const displayName = (`${grandpa ? `${grandpa.name}/` : ''}${foldersToRecreate.join('/')}${foldersToRecreate.length > 1 ? '/' : ''}`
              + `${CLI.chalk.red(CLI.chalk.italic(path.basename(currentContainerPath)))}/${projName}`)

            smart = await Helpers.questionYesNo(`Do you want container ${displayName} to be 'smart' container ?`)
            monorepo = await Helpers.questionYesNo(`Do you want container ${displayName} be monorepo ?`)
          }
          Helpers.writeJson(packageJsonPath, {
            name: path.basename(currentContainerPath),
            version: '0.0.0',
            private: true,
            tnp: {
              version,
              type: 'container',
              monorepo,
              smartContainerBuildTarget: projName
            }
          } as Models.npm.IPackageJSON);
        }
        if (isLastContainer && smart) {
          lastSmart = true;
        }

        currentContainer = (Project.From(currentContainerPath) as Project);
        containers.push(currentContainer);

        if (parentContainer.isContainer) {
          parentContainer.packageJson.linkedProjects.push(path.basename(currentContainer.location));
          parentContainer.packageJson.data.tnp.linkedProjects = Helpers
            .arrays
            .uniqArray(parentContainer.packageJson.linkedProjects)
            .sort()

          parentContainer.packageJson.save(`updating container: `
            + `${grandpa ? `${grandpa.name}/` : ''}${CLI.chalk.bold(parentContainer.name)}`
            + ` linked projects for ${currentContainer.parent._type}"`);
        }
        parentContainer = currentContainer;

        if (isLastContainer && smart && isBrandNew && (!parentContainer || !parentContainer.isSmartContainer)) {
          try {
            currentContainer.run('git init').sync();
          } catch (error) {
            Helpers.warn(`Not able to git init inside: ${currentContainer?.location}`)
          }
        }

        if (!firstContainer) {
          firstContainer = currentContainer;
        }

        if (isLastContainer) {
          lastContainer = currentContainer;
        }
        if (isLastContainer && isBrandNew) {
          lastIsBrandNew = true;
        }

        tmpCwd = currentContainerPath;
      } while (foldersToRecreate.length > 0);
    }

    let appProj: Project;

    const appLocation = lastContainer
      ? crossPlatformPath([lastContainer?.location, projName])
      : crossPlatformPath([cwd, projName]);
    const packageJsonPath = crossPlatformPath([appLocation, config.file.package_json]);

    Helpers.writeJson(packageJsonPath, {
      name: path.basename(projName),
      version: '0.0.0',
      private: true,
      tnp: {
        version: lastContainer ? lastContainer._frameworkVersion : version,
        type: 'isomorphic-lib',
      }
    } as Models.npm.IPackageJSON);
    appProj = (Project.From(appLocation) as Project);
    if (!hasContainersFromArgs) {
      lastContainer = appProj.parent;
    }
    if (lastContainer && lastContainer.isContainer && !lastContainer.isMonorepo) {

      try {
        appProj.run('git init').sync();
      } catch (error) {
        console.log(error);
        Helpers.warn(`Not able to git init inside: ${appProj.location}`)
      }

    }
    appProj.addSourcesFromCore();

    // console.log({

    //   appProj,
    // });

    if (lastContainer && lastSmart) {
      lastContainer.smartNodeModules.setToSmartContainer();
    }

    await appProj.filesStructure.init(appProj.name);

    if (lastContainer?.isSmartContainer) {
      appProj.removeStandaloneSources();
    } else {
      appProj.replaceSourceForStandalone();
    }

    if (lastContainer) {
      lastContainer.packageJson.linkedProjects.push(path.basename(projName));
      lastContainer.packageJson.data.tnp.linkedProjects = Helpers
        .arrays
        .uniqArray(lastContainer.packageJson.linkedProjects)
        .sort()

      lastContainer.parent.packageJson.save(`updating container: ${CLI.chalk.bold(lastContainer.name)} linked projects for ${projName}"`);
    }

    // if (lastContainer && lastContainer.isContainer && lastContainer.location !== grandpa.location) {
    //   await lastContainer.filesStructure.init(lastContainer.isSmartContainer ? appProj.name : '');
    // }

    // if (grandpa && (grandpa.isContainer || grandpa.isStandaloneProject)) {
    //   await grandpa.filesStructure.init(grandpa.isSmartContainer ? appProj.name : '')
    // }

    appProj.recreate.vscode.settings.hideOrShowFilesInVscode(true);

    if (appProj.git.isGitRoot) {
      try {
        this.addRemoteToStandalone(appProj);
      } catch (error) {
      }
    }



    return { containers, firstContainer, lastContainer, lastIsBrandNew, appProj };
  }
  //#endregion

  //#region create container or standalone
  public async createContainersOrStandalone(options: NewSiteOptions) {
    let { name: nameFromArgs, cwd, version } = this.fixOptions_create(options);
    const { appProj, containers, lastContainer, lastIsBrandNew } = await this.initContainersAndApps(cwd, nameFromArgs, version);

    if (appProj.isSmartContainerChild) {
      Helpers.writeFile([appProj.location, 'README.md'], `
      #  @${appProj.parent.name}/${appProj.name}

      I am child of smart container.
      `)
    } else {
      Helpers.writeFile([appProj.location, 'README.md'], `
      #  ${appProj.name}

      I am standalone project.
      `)
    }
    if (lastIsBrandNew) {
      lastContainer.writeFile('README.md', `
      # @${lastContainer.name}

      This smart container is perfect for publishing organizaiton npm pacakges

      `)
    }

    for (let index = 0; index < containers.length; index++) {
      const container = containers[index];
      if (container.isSmartContainer) {
        await container.filesStructure.init(``);
        container.recreate.initVscode();
      } else {
        await container.filesStructure.init('');
        container.recreate.initVscode();
      }
    }

    Helpers.info(`DONE CREATING ${nameFromArgs}`);
  }
  //#endregion

}
