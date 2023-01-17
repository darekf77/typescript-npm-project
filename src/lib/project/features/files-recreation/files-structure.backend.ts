import { path } from 'tnp-core'
import { _ } from 'tnp-core';
import chalk from 'chalk';
import { fse } from 'tnp-core'

import { Helpers } from 'tnp-helpers';
import { FeatureForProject, Project } from '../../abstract';
import { config } from 'tnp-config';
import { ProjectFactory } from '../../../scripts/NEW-PROJECT_FILES_MODULES';
import { PROGRESS_DATA } from 'tnp-models';
import { Models } from 'tnp-models';
import { EnvironmentConfig } from '../environment-config';

export type CleanType = 'all' | 'only_static_generated';
export type InitOptions = {
  watch: boolean;
  watchOnly?: boolean;
  alreadyInitedPorjects?: Project[];
  initiator?: Project;
  // initiator: Project;
}

export class FilesStructure extends FeatureForProject {
  // handledSmartContainer = {};
  findBaselines(proj: Project, baselines: Project[] = []): Project[] {
    if (!!proj.baseline) {
      baselines.unshift(proj.baseline)
    } else {
      return baselines;
    }
    return this.findBaselines(proj.baseline);
  }

  private fixOptionsArgs(options: InitOptions) {
    if (_.isUndefined(options)) {
      options = {} as any;
    }
    if (_.isUndefined(options.alreadyInitedPorjects)) {
      options.alreadyInitedPorjects = [];
    }
    if (_.isUndefined(options.watch)) {
      options.watch = false;
    }
    // if (_.isUndefined(options.initiator)) {
    //   options.initiator = this.project;
    // }
    return options;
  }

  private get taskNames() {
    return {
      sourceModifir: `[filestructure] (${chalk.bold(this.project.genericName)
        }) Client source modules pathes modifier `,
      frameworkFileGenerator: `[filestructure] (${chalk.bold(this.project.genericName)
        }) Files generator: entites.ts, controllers.ts`,
      joinMerge: `[filestructure] Join project ${this.project.genericName}`,
    };
  }

  public async struct(args?: string) {
    if (!args) {
      args = '';
    }
    args += ' --struct';
    if (!this.project.isGenerated) {
      Helpers.removeIfExists(path.join(this.project.location, config.file.tnpEnvironment_json));
    }
    await this.init(args);
  }


  public async init(args: string, options?: InitOptions) {
    if (!args) {
      args = '';
    }
    options = this.fixOptionsArgs(options);

    if (!options.initiator) {
      options.initiator = this.project;
    }
    const { alreadyInitedPorjects, watch, watchOnly } = options;
    let { skipNodeModules, websql, recrusive, env, struct, skipSmartContainerDistBundleInit }: Models.dev.InitArgOptions = require('minimist')(args.split(' '));
    args = Helpers.cliTool.removeArgFromString(args);

    // THIS IS SLOW... BUT I CAN AFORD IT HERE
    if (!_.isUndefined(alreadyInitedPorjects.find(p => p.location === this.project.location))) {
      this.project.quickFixes.missingSourceFolders();
      if (this.project.isStandaloneProject && this.project.packageJson) {
        this.project.packageJson.updateHooks()
      }
      this.project.notAllowedFiles().forEach(f => {
        // Helpers.log(`[init] removing not allowed ${ path.basename(f) } `)
        Helpers.removeFileIfExists(path.join(this.project.location, f));
      });
    }

    if (struct) {
      skipNodeModules = true;
    }

    if (options.initiator.location === this.project.location && this.project.isWorkspace && options.watch) {
      recrusive = true;
    }

    Helpers.log(`[init] __initProcedure start for  ${this.project.genericName} `)
    await this.project.__initProcedure();
    Helpers.log(`[init] __initProcedure end for  ${this.project.genericName} `)

    await this.project.linkedRepos.update(struct);

    if (this.project.isWorkspace || this.project.isWorkspaceChildProject) {
      if (env) {
        Helpers.log(`ENVIRONMENT: ${chalk.bold(env)} inited for ${this.project.genericName}`)
      } else {
        if (this.project.isGenerated) {
          args += `${args} --env=static`;
          Helpers.log(`ENVIRONMENT(for local static build): "${chalk.bold('static')}"`
            + ` initing for ${this.project.genericName}`)
        } else {
          args += `${args} --env=local`;
          Helpers.log(`ENVIRONMENT(for local watch development): "${chalk.bold('local')}"`
            + ` initing for ${this.project.genericName}`)
        }
      }
    }


    Helpers.log(`[init] adding project is not exists...done(${this.project.genericName})  `)

    if (!_.isUndefined(alreadyInitedPorjects.find(p => p.location === this.project.location))) {
      Helpers.log(`Already inited project: ${chalk.bold(this.project.genericName)} - skip`);
      return;
    } else {
      Helpers.log(`Not inited yet... ${chalk.bold(this.project.genericName)} in ${this.project.location} `);
    }

    this.project.quickFixes.missingSourceFolders();
    this.project.quickFixes.linkSourceOfItselfToNodeModules();
    this.project.quickFixes.missingAngularLibFiles();
    if (this.project.isWorkspace || this.project.isTnp) { // TODO make it for standalone
      this.project.quickFixes.overritenBadNpmPackages();

    }
    if (this.project.isWorkspace || this.project.isStandaloneProject || this.project.isContainer) {
      this.project.quickFixes.missingLibs(config.quickFixes.missingLibs)
    }

    if (this.project.isWorkspace || this.project.isStandaloneProject) {
      Helpers.info(`Initing project: ${chalk.bold(this.project.genericName)}`);
      Helpers.log(` (from locaiton: ${this.project.location})`);
      Helpers.log(`Init mode: ${websql ? '[WEBSQL]' : ''}`)
    }

    alreadyInitedPorjects.push(this.project)
    Helpers.log(`Push to alread inited ${this.project.genericName} from ${this.project.location} `)

    //#region handle init of container
    if (this.project.isContainer) {
      await this.project.recreate.init();

      if (!this.project.isContainerOrWorkspaceWithLinkedProjects) {
        const containerChildren = this.project.children.filter(c => {
          Helpers.log('checking if git repo')
          if (c.git.isGitRepo) {
            Helpers.log(`[init] not initing recrusively, it is git repo ${c.name} `)
            return false;
          }
          Helpers.log('checking if git repo - done')
          return true;
        })
        for (let index = 0; index < containerChildren.length; index++) {
          const containerChild = containerChildren[index];
          await containerChild.filesStructure.init(args, options);
          for (let indexChild = 0; indexChild < containerChild.children.length; indexChild++) {
            const workspaceChild = containerChild.children[indexChild];
            await workspaceChild.filesStructure.init(args, options)
          }
        }
      }

    }
    //#endregion


    //#region recretate forsite

    // if (this.project.isWorkspace && this.project.isSiteInStrictMode) {
    //   const recreated = this.recreateSiteChildren();
    //   for (let index = 0; index < recreated.length; index++) {
    //     const newChild = recreated[index];
    //     await newChild.filesStructure.init(args, options);
    //   }
    // }
    if (this.project.isWorkspace && recrusive) {
      const workspaceChildren = this.project.children;
      for (let index = 0; index < workspaceChildren.length; index++) {
        const workspaceChild = workspaceChildren[index];
        await workspaceChild.filesStructure.init(args, options);
      }
    }

    //#endregion

    // if (this.project.isSiteInStrictMode) {
    //   await this.project.baseline.filesStructure.init(args, options);
    // }

    if (this.project.isWorkspaceChildProject) {
      await this.project.parent.filesStructure.init(args, options);
    }

    //#region report progress initing project
    if (this.project.isWorkspaceChildProject) {
      Helpers.info(`Initing project(workspace child): ${chalk.bold(this.project.genericName)} `);
    }
    if (global.tnpNonInteractive) {
      PROGRESS_DATA.log({ msg: `Initing project: "${this.project.genericName}" started` });
    }
    //#endregion

    if (this.project.isWorkspaceChildProject) {
      const isInNodeMOdules = path.join(this.project.parent.location, config.folder.node_modules, this.project.name);
      if (!fse.existsSync(isInNodeMOdules)) {
        this.project.parent.workspaceSymlinks.add(`Init of workspace child project`)
      }
    }

    await this.project.recreate.init();
    this.project.recreate.vscode.settings.toogleHideOrShowDeps();

    if (this.project.isStandaloneProject) {
      if (_.isNil(this.project.buildOptions)) { // TODO QUICK_FIX
        this.project.buildOptions = {} as any;
      }
      await (this.project.env as any as EnvironmentConfig).init(args);
      this.project.filesTemplatesBuilder.rebuild();
    }

    //#region handle node modules instalation
    if (!this.project.isDocker) {
      if (!this.project.node_modules.exist) {
        if (skipNodeModules) {
          if (!fse.existsSync(path.join(this.project.location, config.folder.node_modules))) {
            Helpers.mkdirp(path.join(this.project.location, config.folder.node_modules));
          }
        } else {
          await this.project.npmPackages.installProcess(`initialize procedure of ${this.project.name} `);
        }
      } else {
        if (this.project.isStandaloneProject && this.project.frameworkVersionAtLeast('v2')) {
          this.project.packageJson.showDeps(`Show new deps for ${this.project._frameworkVersion} `);
        }
      }

      if (this.project.isContainerCoreProject && this.project.frameworkVersionEquals('v1')) {
        this.project.quickFixes.overritenBadNpmPackages();
      }

    }

    //#endregion

    let client = Helpers.removeSlashAtEnd(_.first((args || '').split(' '))) as any;
    const smartContainerBuildTarget = (
      this.project.isSmartContainerChild
        ? this.project?.parent.smartContainerBuildTarget
        : (this.project.isSmartContainer ? this.project.smartContainerBuildTarget : void 0)
    )

    if (!client && smartContainerBuildTarget) {
      client = smartContainerBuildTarget.name;
    }
    if (!client) {
      const fisrtChild = _.first(this.project.isSmartContainer ? this.project.children : this.project.parent?.children);
      if (fisrtChild) {
        client = fisrtChild.name;
      }
    }


    if (this.project.isSmartContainer && !skipSmartContainerDistBundleInit) {
      //#region handle smart container
      Helpers.writeFile([this.project.location, 'angular.json'], this.angularJsonContainer);
      await this.project.singluarBuild.init(watch, false, 'dist', args, client);
      await this.project.singluarBuild.init(watch, false, 'bundle', args, client);
      //#endregion
    }


    if (this.project.isWorkspace || this.project.isWorkspaceChildProject) {

      if (this.project.isSiteInStrictMode && !this.project.isDocker) {
        if (watch) {
          await this.project.join.startAndWatch(this.taskNames.joinMerge, {
            watchOnly, afterInitCallBack: async () => {
              await this.project.compilerCache.setUpdatoDate.join();
            }
          })
        } else {
          await this.project.join.start(this.taskNames.joinMerge);
        }
      }

      await (this.project.env as any as EnvironmentConfig).init(args);
      this.project.filesTemplatesBuilder.rebuild();
    }
    if (this.project.isWorkspace) {
      this.project.recreateCodeWorkspace();
    }


    this.project.quickFixes.missingSourceFolders();

    this.project.quickFixes.badTypesInNodeModules();

    if (!this.project.isDocker && !this.project.isVscodeExtension) {
      if (this.project.isWorkspaceChildProject || this.project.isStandaloneProject) {
        if (watch) {
          await this.project.frameworkFileGenerator.startAndWatch(this.taskNames.frameworkFileGenerator, {
            watchOnly, afterInitCallBack: async () => {
              await this.project.compilerCache.setUpdatoDate.frameworkFileGenerator();
            }
          });
          // if (!this.project) {
          //   console.trace('HERE')
          // }
          await this.project.sourceModifier.startAndWatch(this.taskNames.sourceModifir, {
            watchOnly, afterInitCallBack: async () => {
              await this.project.compilerCache.setUpdatoDate.sourceModifier();
            }
          });
        } else {
          await this.project.frameworkFileGenerator.start(this.taskNames.frameworkFileGenerator);
          // if (!this.project) {
          //   console.trace('HERE')
          // }
          await this.project.sourceModifier.start(this.taskNames.sourceModifir);
        }
        // process.exit(0)
      }
    }
    Helpers.log(`Init DONE for project: ${chalk.bold(this.project.genericName)} `);
  }



  recreateSiteChildren() {
    const newChilds: Project[] = []
    const baseline = this.project.baseline;
    baseline.children.forEach(c => {
      const siteChild = path.join(this.project.location, c.name);
      if (!fse.existsSync(siteChild)) {
        ProjectFactory.Instance.createWorksapceOrStandalone({
          type: c._type,
          name: c.name,
          cwd: this.project.location,
          basedOn: void 0
        });
        const newChild = Project.From<Project>(siteChild);
        c.packageJson.copyTo(newChild);
        Helpers.tryRemoveDir(path.join(newChild.location, config.folder.src));
        Helpers.tryRemoveDir(path.join(newChild.location, config.folder.components));
        newChild.recreate.vscode.settings.colorsFromWorkspace();
        newChilds.push(newChild);
      }
    });
    return newChilds;
  }

  private async recrusiveOperation(proj: Project, recrusive = false, type: keyof Project) {

    if (type === 'clear') {
      await proj.clear()
    } else if (type === 'reset') {
      await proj.reset()
    }
    if (recrusive) {
      for (let index = 0; index < proj.children.length; index++) {
        const c = proj.children[index];
        await this.recrusiveOperation(c, recrusive, type)
      }
    }
  }

  public async reset(options?: { recrusive: boolean; }) {
    let { recrusive = false } = options || {};
    if (this.project.isSmartContainer) {
      recrusive = true;
    }
    await this.recrusiveOperation(this.project, recrusive, 'reset')
  }

  public async clear(options?: { recrusive: boolean; }) {
    let { recrusive = false } = options || {};
    if (this.project.isSmartContainer) {
      recrusive = true;
    }
    await this.recrusiveOperation(this.project, recrusive, 'clear')
  }

  private resolveArgs(args: string) {
    let { recrusive = false, r = false } = require('minimist')(args.split(' '));
    recrusive = (recrusive || r);
    return { recrusive }
  }

  async resetFromArgs(args) {
    const { recrusive } = this.resolveArgs(args)
    await this.reset({ recrusive })
  }

  async clearFromArgs(args) {
    const { recrusive } = this.resolveArgs(args);
    if (this.project.npmPackages.useSmartInstall) {
      await this.clear({ recrusive });
    } else {
      await Helpers.questionYesNo(`Do you wanna delete node_modules and reset ${recrusive ? 'project(s) recursively' : 'project(s)'} ?`, async () => {
        await this.clear({ recrusive });
      });
    }

  }

  /**
   * dummy angular.json file for scss generation
   */
  get angularJsonContainer() {
    return {
      "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
      "version": 1,
      "newProjectRoot": "projects",
      "projects": {
        "sassy-project": {
          "projectType": "application",
          "schematics": {
            "@schematics/angular:component": {
              "style": "scss"
            },
            "@schematics/angular:application": {
              "strict": true
            }
          },
          "root": "",
          "sourceRoot": "src",
          "prefix": "app",
          "architect": {
            "build": {
              "builder": "@angular-devkit/build-angular:browser",
              "options": {
                "outputPath": "dist/sassy-project",
                "index": "src/index.html",
                "main": "src/main.ts",
                "polyfills": "src/polyfills.ts",
                "tsConfig": "tsconfig.app.json",
                "inlineStyleLanguage": "scss",
                "assets": [
                  "src/favicon.ico",
                  "src/assets"
                ],
                "styles": [
                  "src/styles.scss"
                ],
                "scripts": []
              },
              "configurations": {
                "production": {
                  "budgets": [
                    {
                      "type": "initial",
                      "maximumWarning": "500kb",
                      "maximumError": "1mb"
                    },
                    {
                      "type": "anyComponentStyle",
                      "maximumWarning": "2kb",
                      "maximumError": "4kb"
                    }
                  ],
                  "fileReplacements": [
                    {
                      "replace": "src/environments/environment.ts",
                      "with": "src/environments/environment.prod.ts"
                    }
                  ],
                  "outputHashing": "all"
                },
                "development": {
                  "buildOptimizer": false,
                  "optimization": false,
                  "vendorChunk": true,
                  "extractLicenses": false,
                  "sourceMap": true,
                  "namedChunks": true
                }
              },
              "defaultConfiguration": "production"
            },
            "serve": {
              "builder": "@angular-devkit/build-angular:dev-server",
              "configurations": {
                "production": {
                  "browserTarget": "sassy-project:build:production"
                },
                "development": {
                  "browserTarget": "sassy-project:build:development"
                }
              },
              "defaultConfiguration": "development"
            },
            "extract-i18n": {
              "builder": "@angular-devkit/build-angular:extract-i18n",
              "options": {
                "browserTarget": "sassy-project:build"
              }
            },
            "test": {
              "builder": "@angular-devkit/build-angular:karma",
              "options": {
                "main": "src/test.ts",
                "polyfills": "src/polyfills.ts",
                "tsConfig": "tsconfig.spec.json",
                "karmaConfig": "karma.conf.js",
                "inlineStyleLanguage": "scss",
                "assets": [
                  "src/favicon.ico",
                  "src/assets"
                ],
                "styles": [
                  "src/styles.scss"
                ],
                "scripts": []
              }
            }
          }
        }
      },
      "defaultProject": "sassy-project"
    }


  }

}
