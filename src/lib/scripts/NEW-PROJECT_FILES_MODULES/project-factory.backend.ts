//#region imports
import { crossPlatformPath, _ } from 'tnp-core/src';
import { path } from 'tnp-core/src';
import { fse } from 'tnp-core/src';
import { JSON10 } from 'json10/src';
import { config, ConfigModels } from 'tnp-config/src';
import { Models } from 'tnp-models/src';
import { Helpers } from 'tnp-helpers/src';
import { Project } from '../../project/abstract/project/project';
import { CLI } from 'tnp-cli/src';
import { notAllowedProjectNames } from '../../constants';
//#endregion

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
    Project.From(cwd).filesFactory.createModel(relativePath, name);
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
        try {
          appProj.run('git remote add origin ' + newRemote, { output: false, silence: true }).sync();
          appProj.run('git add --all . && git commit -m "first"', { output: false, silence: true }).sync();
        } catch (error) { }
      }

    }
  }
  //#endregion

  //#region init containers
  private async initContainersAndApps(cwd: string, nameFromArgs: string, version: ConfigModels.FrameworkVersion) {
    nameFromArgs = nameFromArgs.replace('./', '')
    nameFromArgs = nameFromArgs.replace('.\\', '')
    nameFromArgs = nameFromArgs.replace(/\/$/, '')
    nameFromArgs = nameFromArgs.replace(/\\$/, '')
    nameFromArgs = nameFromArgs.replace(/\\$/g, '/')

    /**
     * examples:
     * my-app
     * my-org/my-app
     * my-big-org/my-smaller-org/my-app
     * ..
     */
    const allProjectFromArgs = nameFromArgs.includes('/') ? nameFromArgs.split('/') : [nameFromArgs];

    const hasAutoCreateNormalContainersFromArgs = (allProjectFromArgs.length > 2);
    const hasAtLeastOneContainersFromArgs = (allProjectFromArgs.length > 1);

    // app OR org/app
    const standaloneOrOrgWithStanalonePathName = crossPlatformPath([
      path.basename(path.dirname(allProjectFromArgs.join('/'))),
      path.basename(allProjectFromArgs.join('/'))
    ]);

    // additional auto created normal containers
    const autoCreateNormalContainersPathName = ((hasAutoCreateNormalContainersFromArgs)
      ? (allProjectFromArgs.join('/').replace(standaloneOrOrgWithStanalonePathName, ''))
      : '').replace(/\/$/, '');

    const lastProjectFromArgName = (allProjectFromArgs.length > 0)
      ? _.last(allProjectFromArgs) // last org proj
      : _.first(allProjectFromArgs); // standalone proj

    const notAllowedNameForApp = notAllowedProjectNames.find(a => a === lastProjectFromArgName);
    if (!!notAllowedNameForApp) {
      Helpers.error(`

      Name ${CLI.chalk.bold(notAllowedNameForApp)} is not allowed.

      Use different name: ${CLI.chalk.bold(crossPlatformPath(
        path.dirname(allProjectFromArgs.join('/'))).replace(notAllowedNameForApp, 'my-app-or-something-else')
      )}

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

    if (hasAtLeastOneContainersFromArgs) {
      const foldersToRecreate = _.cloneDeep(allProjectFromArgs).slice(0, allProjectFromArgs.length - 1);
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

            const displayNameForLastContainerBeforeApp = (hasAtLeastOneContainersFromArgs ?
              (CLI.chalk.italic(`${autoCreateNormalContainersPathName ? autoCreateNormalContainersPathName + '/' : ''}`)
                + `${CLI.chalk.italic.red(path.basename(path.dirname(standaloneOrOrgWithStanalonePathName)))}`
                + CLI.chalk.italic(`/${lastProjectFromArgName}`))
              : CLI.chalk.italic(standaloneOrOrgWithStanalonePathName)
            )

            Helpers.info(`

${CLI.chalk.bold('SMART CONTAINERS')} - can be used to publish npm organization packages ex. @org/package-name
${CLI.chalk.bold('NORMAL CONTAINERS')} - are just a wrapper for other project for easy
git pull/push or children packages release. Normal container can wrap "standalone" or "smart container" projects.

            `)


            smart = await Helpers.questionYesNo(`Do you want container ${displayNameForLastContainerBeforeApp} to be 'smart' container ?`)
            monorepo = await Helpers.questionYesNo(`Do you want container ${displayNameForLastContainerBeforeApp} be monorepo ?`)
          }
          const smartContainerBuildTarget = (hasAtLeastOneContainersFromArgs
            && (path.basename(currentContainerPath) === _.first(lastProjectFromArgName.split('/'))))
            ? lastProjectFromArgName : void 0;

          Helpers.writeJson(packageJsonPath, {
            name: path.basename(currentContainerPath),
            version: '0.0.0',
            private: true,
            tnp: {
              version,
              type: 'container',
              monorepo,
              smartContainerBuildTarget
            }
          } as Models.npm.IPackageJSON);
        }
        if (isLastContainer && smart) {
          lastSmart = true;
        }

        currentContainer = (Project.From(currentContainerPath) as Project);
        containers.push(currentContainer);

        if (parentContainer?.isContainer) {
          parentContainer.packageJson.linkedProjects.push(path.basename(currentContainer.location));
          parentContainer.packageJson.data.tnp.linkedProjects = Helpers
            .arrays
            .uniqArray(parentContainer.packageJson.linkedProjects)
            .sort()

          parentContainer.packageJson.save(`updating container: `
            + `${grandpa ? `${grandpa.name}/` : ''}${CLI.chalk.bold(parentContainer.name)}`
            + ` linked projects for ${currentContainer.parent.type}"`);
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
      ? crossPlatformPath([lastContainer?.location, lastProjectFromArgName])
      : crossPlatformPath([cwd, lastProjectFromArgName]);
    const packageJsonPath = crossPlatformPath([appLocation, config.file.package_json]);

    Helpers.writeJson(packageJsonPath, {
      name: path.basename(lastProjectFromArgName),
      version: '0.0.0',
      private: true,
      tnp: {
        version: lastContainer ? lastContainer._frameworkVersion : version,
        type: 'isomorphic-lib',
      }
    } as Models.npm.IPackageJSON);
    appProj = (Project.From(appLocation) as Project);
    if (!hasAtLeastOneContainersFromArgs) {
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
      lastContainer.packageJson.linkedProjects.push(path.basename(lastProjectFromArgName));
      lastContainer.packageJson.data.tnp.linkedProjects = Helpers
        .arrays
        .uniqArray(lastContainer.packageJson.linkedProjects)
        .sort()

      lastContainer.parent?.packageJson.save(`updating container: ${CLI.chalk.bold(lastContainer.name)} linked projects for ${lastProjectFromArgName}"`);
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



    return {
      containers, firstContainer, lastContainer,
      lastIsBrandNew, appProj, containersAndProjFromArgName: allProjectFromArgs,
      preOrgs: autoCreateNormalContainersPathName
    };
  }
  //#endregion

  //#region create container or standalone
  public async createContainersOrStandalone(options: NewSiteOptions) {
    let { name: nameFromArgs, cwd, version } = this.fixOptions_create(options);
    const { appProj, containers, lastContainer,
      lastIsBrandNew,
    } = await this.initContainersAndApps(cwd, nameFromArgs, version);

    if (!lastContainer?.packageJson.data?.tnp?.smartContainerBuildTarget && lastContainer?.children.length > 0) {
      if (appProj.isSmartContainerChild) {
        lastContainer.packageJson.data.tnp.smartContainerBuildTarget = _.first(lastContainer.children.filter(c => c.name !== appProj.name))?.name;
        lastContainer.packageJson.save('updating smart container target')
      }
    }


    if (appProj.isSmartContainerChild) {

      // QUICK_FIX
      appProj.writeFile('src/lib/my-organization-proj.ts', `
export function myOrgProj${(new Date()).getTime()}() {
  console.log('hello my organization project')
}

      `)

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
    //     Helpers.info(`

    //     DONE CREATING ${containersAndProjFromArgName.join('/')}

    // ${CLI.chalk.green('To start developing firedev\'s backend/frontend apps/libs execute command:')}

    // cd ${preOrgs + '/' + (cleanDisplaName.includes('/') ? _.first(cleanDisplaName.split('/')) : cleanDisplaName)
    //       } && firedev start ${_.last(containersAndProjFromArgName)} --websql


    //     `);
  }
  //#endregion

}

