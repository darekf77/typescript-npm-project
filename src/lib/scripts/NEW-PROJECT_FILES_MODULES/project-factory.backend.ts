import { _ } from 'tnp-core';
import { path } from 'tnp-core'
import { fse } from 'tnp-core'

import { JSON10 } from 'json10';
import { config, ConfigModels } from 'tnp-config';
import { Models } from 'tnp-models';
import { Helpers } from 'tnp-helpers';
import { Project } from '../../project/abstract/project/project';
import { CLI } from 'tnp-cli';

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

  //#region destination path
  private getDestinationPath(projectName: string, cwd: string) {
    if (path.isAbsolute(projectName)) {
      return projectName;
    }
    return path.join(cwd, projectName);
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

  private errorMsgCreateSite() {
    console.log(CLI.chalk.green(`Good examples: ` +
      `${config.frameworkName} new site:strict:site  path-to-baseline-project` +
      `${config.frameworkName} new site:dependenct:site  path-to-baseline-project`
    ));
    Helpers.error(`Please use example above.`, false, true);
  }
  //#endregion

  //#region fix after crateion
  private pacakgeJsonFixAfterCreation(locationDest, basedOn?: string, name?: string, isDependencySite = false) {
    const pkgJSONpath = path.join(locationDest, config.file.package_json);
    const json: Models.npm.IPackageJSON = fse.readJSONSync(pkgJSONpath)
    json.name = ((name === path.basename(locationDest)) ? name : _.kebabCase(path.basename(locationDest)));
    if (!json.tnp) {
      // @ts-ignore
      json.tnp = {};
    }
    json.version = '0.0.0';
    json.private = true;
    json.tnp.type = 'isomorphic-lib';
    json.tnp.version = config.defaultFrameworkVersion;
    json.tnp.isCoreProject = false;
    json.tnp.isGenerated = false;
    json.tnp.useFramework = false;
    json.tnp.required = [];
    json.tnp.requiredServers = [];
    if (!isDependencySite && basedOn) {
      json.tnp.basedOn = basedOn;
    }

    Helpers.writeFile(pkgJSONpath, json);
  }
  //#endregion

  //#region fix options
  private fixOptions_create(options: NewSiteOptions) {
    if (_.isNil(options)) {
      options = {} as any;
    }

    if (_.isNil(options.version)) {
      options.version = config.defaultFrameworkVersion;
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
      version: config.defaultFrameworkVersion, // (_.isString(version) && version.length <= 3 && version.startsWith('v')) ? version : void 0,
      skipInit
    });

    if (exit) {
      process.exit(0)
    }

  }
  //#endregion

  //#region workspace
  /**
   * @deprecated
   */
  public async workspaceFromArgs(args: string, exit = true, cwd: string) {
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


    if (basedOn) {
      Helpers.error(`To create workspace site use command: `
        + `${config.frameworkName} new: site name - of - workspace - site`
        + `--basedOn relativePathToBaselineWorkspace`, false, true);
    }
    const type = 'isomorphic-lib' as any;
    const name = argv[0];

    const proj = await this.createWorksapceOrStandalone({
      type,
      name,
      cwd,
      basedOn: void 0,
      version: config.defaultFrameworkVersion, // (_.isString(version) && version.length <= 3 && version.startsWith('v')) ? version : void 0,
      skipInit
    });

    Helpers.writeFile([proj.location, 'README.md'], `
  #  ${_.startCase(proj.name)}

    `)

    if (exit) {
      process.exit(0)
    }

  }
  //#endregion

  //#region create workspace site
  /**
   * @deprecated
   */
  public async workspaceSiteFromArgs(args: string, exit = true, cwd: string, strictSiteMode = true) {
    const argv = args.split(' ');

    if (args.length < 2) {
      this.errorMsgCreateSite()
    }
    const alsoBasedOn = ((argv.length > 2 && !strictSiteMode) ? (argv.slice(2)) : []);

    await this.createWorksapceOrStandalone({
      type: 'workspace',
      name: argv[0] as any,
      cwd,
      basedOn: argv[1] as any,
      siteProjectMode: strictSiteMode ? 'strict' : 'dependency',
      alsoBasedOn
    });
    if (exit) {
      process.exit(0)
    }
  }
  //#endregion

  private async initContainersAndApps(cwd: string, containersAndProj: string[], version: ConfigModels.FrameworkVersion) {
    const hasContainers = (containersAndProj.length > 1);
    const projName = hasContainers ? _.last(containersAndProj) : _.first(containersAndProj);
    if (projName === 'app') {
      Helpers.error(`

      Name ${CLI.chalk.bold('app')} is not allowed for container child.

      Use different name: ${CLI.chalk.bold(containersAndProj.join('/').replace('app', 'my-app-or-something-else'))}

      `,false,true);
    }
    let firstContainer: Project;
    let lastContainer: Project;
    let lastIsBrandNew = false;
    let lastSmart = false;
    const grandpa = Project.From(cwd) as Project;
    const containers: Project[] = [
      ...((grandpa && grandpa.isContainer) ? [grandpa] : []),
    ];

    if (hasContainers) {
      const foldersToRecreate = _.cloneDeep(containersAndProj).slice(0, containersAndProj.length - 1);
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
          currentContainer.run('git init').sync();
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

    const appLocation = lastContainer ? path.join(lastContainer?.location, projName) : path.join(cwd, projName);
    const packageJsonPath = path.join(appLocation, config.file.package_json);
    Helpers.writeJson(packageJsonPath, {
      name: path.basename(projName),
      version: '0.0.0',
      private: true,
      tnp: {
        version,
        type: 'isomorphic-lib',
      }
    } as Models.npm.IPackageJSON);
    appProj = (Project.From(appLocation) as Project);
    if (lastContainer && lastContainer.isContainer && !lastContainer.isMonorepo) {
      appProj.run('git init').sync();
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

    return { containers, firstContainer, lastContainer, lastIsBrandNew, appProj };
  }

  public async createContainersOrStandalone(options: NewSiteOptions) {
    let { name: nameFromArgs, cwd } = this.fixOptions_create(options);
    const version = config.defaultFrameworkVersion;


    const containersAndProj = nameFromArgs.replace('\\', '/').split('/');
    const { appProj, containers, lastContainer, lastIsBrandNew } = await this.initContainersAndApps(cwd, containersAndProj, version);

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


  //#region create workspace or standalone
  /**
   * @deprecated
   */
  public async createWorksapceOrStandalone(options: NewSiteOptions): Promise<Project> {

    let { type, name: projName, cwd, basedOn, version, skipInit, siteProjectMode, alsoBasedOn } = this.fixOptions_create(options);
    version = config.defaultFrameworkVersion;
    // let cwdProj = Project.From<Project>(cwd);
    // if (cwdProj && cwdProj.isWorkspace) {
    //   version = cwdProj._frameworkVersion;
    // } else {
    //   version = config.defaultFrameworkVersion;
    // }
    // if (cwdProj && cwdProj.isContainer) {
    //   version = cwdProj._frameworkVersion;
    // }

    let smart = false;
    const containersAndProj = projName.replace('\\', '/').split('/');

    if (containersAndProj.length > 1) {
      var firstContainer: Project;

      projName = _.last(containersAndProj);
      const foldersToRecreate = _.cloneDeep(containersAndProj).slice(0, containersAndProj.length - 1);
      let tmpCwd = cwd;
      do {
        const folder = foldersToRecreate.shift();
        const containerPath = path.join(tmpCwd, folder);
        if (!Helpers.exists(containerPath)) {
          Helpers.mkdirp(containerPath);
        }
        const packageJsonPath = path.join(containerPath, config.file.package_json);
        if (!Helpers.exists(packageJsonPath)) {
          smart = await Helpers.questionYesNo(`Do you want smart container for ${CLI.chalk.bold(path.basename(containerPath))} ? `)
          Helpers.writeJson(packageJsonPath, {
            name: path.basename(containerPath),
            version: '0.0.0',
            private: true,
            tnp: {
              version: config.defaultFrameworkVersion,
              type: 'container',
              smart,
            }
          } as Models.npm.IPackageJSON);
        }
        tmpCwd = containerPath;
        cwd = containerPath;
        const containerProj = (Project.From(containerPath) as Project);
        if (containerProj) {
          await containerProj.filesStructure.init(smart ? projName : '')
          containerProj.run('git init').sync();
          if (!firstContainer) {
            firstContainer = containerProj;
          }
        }
      } while (foldersToRecreate.length > 0);
    }

    if (firstContainer && firstContainer.parent?.isContainer) {
      await firstContainer.parent.filesStructure.init(firstContainer.parent.isSmartContainer ? projName : '')
    }


    Helpers.log(`[create] version: ${version} `);
    Helpers.log(`[create] skip init ${skipInit} `);


    const nameKebakCase = _.kebabCase(projName);
    if (nameKebakCase !== projName) {
      Helpers.info(`[craete] Project name renemed to: ${nameKebakCase} `);
      projName = nameKebakCase;
    }
    if (_.isString(basedOn)) {
      basedOn = basedOn.replace(/\/$/, '');
    }
    const basedOnProject = basedOn && Project.nearestTo<Project>(path.join(cwd, basedOn));
    if (basedOn && !basedOnProject) {
      Helpers.error(`[create] Not able to find baseline project from relative path: ${basedOn} `, false, true);
    }
    if (basedOn && basedOnProject && basedOnProject.typeIsNot('workspace')) {
      Helpers.error(`[create] Site project only can be workspace, wrong--basedOn param: ${basedOn} `, false, true);
    }

    let baseline = basedOn ? basedOnProject : Project.by<Project>(type, version);
    Helpers.log(`[create] PROJECT BASELINE ${baseline.name} in ${baseline.location} `);

    // console.log({ type, name, cwd, basedOn, version, skipInit, siteProjectMode });


    // await baseline.reset();
    Helpers.log('[create] Baseline reset done')
    await baseline.filesStructure.init(` --recrusive `);
    Helpers.log('[create] Baseline init done')
    // await baseline.run(`${ config.frameworkName } reset && ${ config.frameworkName } init--recrusive`, {
    //   prefix: CLI.chalk.bold(`[INITING BASELINE ${ baseline.genericName } ]`)
    // }).asyncAsPromise();

    // TODO this requred source modifer changes
    // if (siteProjectMode === 'dependency') {
    //   const otherBaselines = alsoBasedOn.map(c => {
    //     const dep = Project.From<Project>(path.join(cwd, c.replace(/\/$/, '')));
    //     if (!dep) {
    //       Helpers.error(`Unknow dependency for site: "${c}"`, false, true);
    //     }
    //     return dep;
    //   });
    //   (otherBaselines.length > 0) && Helpers.log(`Initing subbaselines...`);
    //   for (let index = 0; index < otherBaselines.length; index++) {
    //     const subBaseline = otherBaselines[index];
    //     await subBaseline.run(`${ config.frameworkName } init--recrusive`, {
    //       prefix: CLI.chalk.bold(`[INITING SUB BASELINE ${ subBaseline.genericName } ]`)
    //     }).asyncAsPromise();
    //   }
    //   alsoBasedOn = otherBaselines.map(c => c.name);
    // }

    const destinationPath = this.getDestinationPath(projName, cwd);
    Helpers.log(`[create] Destination path: ${destinationPath} `);

    if (fse.pathExistsSync(destinationPath)) {
      Helpers.info(`[create] Project "${projName}" already exist in this locationzation: ${destinationPath} `);
    } else {
      if (baseline) {
        try {
          baseline.copyManager.generateSourceCopyIn(destinationPath, {
            // ommitSourceCode: global.testMode,
            regenerateOnlyCoreProjects: !basedOn,
            markAsGenerated: false,
            regenerateProjectChilds: true,
            forceCopyPackageJSON: type === 'single-file-project'
          });
          // console.log(destinationPath)
          this.pacakgeJsonFixAfterCreation(destinationPath, basedOn ? basedOn : void 0, projName, siteProjectMode === 'dependency');
          Helpers.info(`[create] project ${projName} created from baseline projec ${baseline.name} success`);
          if (Project.emptyLocations.includes(destinationPath)) {
            Project.emptyLocations = Project.emptyLocations.filter(f => {
              return f !== destinationPath;
            });
            Helpers.info(`[create] Path removed from empty locations`);
          } else {
            Helpers.info(`[create] Path NOT removed from empty locations`);
          }
        } catch (err) {
          // console.log(require('callsite-record')({
          //   forError: err
          // }).renderSync({
          //   // stackFilter(frame) {
          //   //   return !frame.getFileName().includes('node_modules');
          //   // }
          // }))
          Helpers.error(err, true, true);
          Helpers.error(`[create] Not able to create project`, false, true);
        }
      } else {
        this.errorMsgCreateProject();
      }
    }
    if (type === 'workspace') {

      const workspacePrroject = Project.From<Project>(destinationPath);
      if (basedOn && (siteProjectMode === 'strict')) {
        workspacePrroject.baseline.children.forEach(c => {
          Helpers.log(`[craete] Basleine Child project "${c.genericName}"`);
        });
      }
      workspacePrroject.children.forEach(c => {
        Helpers.log(`[create] Child project "${c.genericName}"`);
      });
    }

    Helpers.log(`[create] destinationPath: ${destinationPath} `);
    const newCreatedProject = Project.From<Project>(destinationPath);
    if (!newCreatedProject) {
      Helpers.error(`Not able to crate project in ${destinationPath} `, false, true);
    }
    if (type !== 'single-file-project' && newCreatedProject.typeIs('angular-lib', 'isomorphic-lib')) {
      newCreatedProject.replaceSourceForStandalone();
    }
    if (newCreatedProject.isWorkspace) {
      newCreatedProject.children.forEach(c => c.removeStandaloneSources())
    }
    if (newCreatedProject.isContainer) {
      newCreatedProject.children.forEach(c => {
        if (c.isWorkspace) {
          c.children.forEach(wc => wc.removeStandaloneSources());
        } else {
          c.removeStandaloneSources();
        }
      })
    }
    // const igGitRepo = newCreatedProject.git.isGitRepo;
    // Helpers.info(`newCreatedProject IS GIT REPO: ${ igGitRepo } `)
    // if (!igGitRepo && !newCreatedProject.parent?.isMonorepo) {
    //   Helpers.info(`[create] Git repository inited`);
    //   newCreatedProject.run(`git init`).sync();
    // }
    Helpers.log(`[create] Project from create method: ${newCreatedProject && newCreatedProject.genericName} `)
    if (newCreatedProject) {
      newCreatedProject.recreate.vscode.settings.excludedFiles();
      newCreatedProject.recreate.vscode.settings.colorsFromWorkspace();

      if (siteProjectMode === 'dependency') {
        newCreatedProject.packageJson.data.tnp.dependsOn = [
          baseline.name,
          // ...alsoBasedOn
        ];
        newCreatedProject.packageJson.save(`Update required for site dependency project`)
      }

      if (newCreatedProject.isVscodeExtension) {
        Helpers.setValueToJSON(newCreatedProject.path('.vscode/settings.json').absolute.normal,
          `['workbench.colorCustomizations']['statusBar.background']`, void 0);
        Helpers.setValueToJSON(newCreatedProject.path('.vscode/settings.json').absolute.normal,
          `['workbench.colorCustomizations']['statusBar.debuggingBackground']`, void 0);
        await newCreatedProject.filesStructure.init('');
      } else {
        // if (!skipInit) {
        const skipNodeModules = !newCreatedProject.frameworkVersionAtLeast('v3');
        const argsForInit = `--recrusive ${(skipNodeModules ? '--skipNodeModules' : '')} `;
        await newCreatedProject.filesStructure.init(argsForInit);
        // }
      }
      if (
        (newCreatedProject.parent?.isContainer || newCreatedProject.parent?.isWorkspace)
        && newCreatedProject.typeIs('angular-lib', 'isomorphic-lib', 'vscode-ext')
      ) {

        newCreatedProject.parent.packageJson.linkedProjects.push(path.basename(newCreatedProject.location));
        newCreatedProject.parent.packageJson.data.tnp.linkedProjects = Helpers
          .arrays
          .uniqArray(newCreatedProject.parent.packageJson.linkedProjects)
          .sort()

        newCreatedProject.parent.packageJson.save(`updating "${newCreatedProject.parent._type}" or work linked projects`);

        if (newCreatedProject.parent.git.isGitRepo && newCreatedProject.parent.git.isGitRoot) {
          if (!newCreatedProject.parent.isMonorepo) {
            const parentOrigin = newCreatedProject.parent.git.originURL;
            const projOrigin = (newCreatedProject.isWorkspace
              || (newCreatedProject.isContainerChild && !newCreatedProject.isSmartContainerChild)
            ) ?
              parentOrigin.replace(path.basename(parentOrigin), newCreatedProject.name + '.git')
              : parentOrigin.replace(path.basename(parentOrigin), (newCreatedProject.parent.name + '--' + newCreatedProject.name + '.git'));
            Helpers.info(`Adding git origin: ${projOrigin}
            to project ${newCreatedProject.name} ...`);
            newCreatedProject.run(`git init`
              + `&& git remote add origin ${projOrigin} ` +
              `&& git branch - M master`).sync();
          }
        }
        if (!newCreatedProject?.isSmartContainerChild) {
          await newCreatedProject.parent.filesStructure.struct('');
        }
        if (newCreatedProject.parent.isSmartContainer) {
          await newCreatedProject.parent.filesStructure.init(newCreatedProject.name)
        } else {
          await newCreatedProject.parent.filesStructure.struct('')
        }

      }
    }
    if (firstContainer) {
      await firstContainer.filesStructure.init('');
    }

    return newCreatedProject;
  }
  //#endregion


}
