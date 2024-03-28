import { path } from 'tnp-core/src'
import { _ } from 'tnp-core/src';
import chalk from 'chalk';
import { fse } from 'tnp-core/src'

import { Helpers } from 'tnp-helpers/src';
import { Project } from '../../abstract/project';
import { config } from 'tnp-config/src';
import { argsToClear } from '../../../constants';
import { InitOptions } from '../../../build-options';
import { Models } from '../../../models';
import { BaseFeatureForProject } from 'tnp-helpers/src';

export type CleanType = 'all' | 'only_static_generated';


export class FilesStructure extends BaseFeatureForProject<Project> {


  public async struct(args?: string) {
    if (!args) {
      args = '';
    }
    args += ' --struct';
    Helpers.removeIfExists(path.join(this.project.location, config.file.tnpEnvironment_json));
    await this.init(InitOptions.from({ struct: true }));
  }

  static INITED_PROECT_SHOW_LOG = {};
  public async init(options?: InitOptions) {
    options = InitOptions.from(options);

    if (!options.initiator) {
      options.initiator = this.project;
    }
    const { alreadyInitedPorjects, watch, smartContainerTargetName, struct, branding, websql } = options;



    // THIS IS SLOW... BUT I CAN AFORD IT HERE
    if (!_.isUndefined(alreadyInitedPorjects.find(p => p.location === this.project.location))) {
      this.project.quickFixes.missingSourceFolders();
      if (this.project.__isStandaloneProject && this.project.__packageJson) {
        this.project.__packageJson.updateHooks()
      }
    }

    await this.project.__linkedRepos.update(struct);



    Helpers.log(`[init] adding project is not exists...done(${this.project.genericName})  `)

    if (!_.isUndefined(alreadyInitedPorjects.find(p => p.location === this.project.location))) {
      Helpers.log(`Already inited project: ${chalk.bold(this.project.genericName)} - skip`);
      return;
    } else {
      Helpers.log(`Not inited yet... ${chalk.bold(this.project.genericName)} in ${this.project.location} `);
    }

    this.project.quickFixes.missingSourceFolders();

    if (this.project.__isSmartContainer) {
      const children = this.project.children;
      for (let index = 0; index < children.length; index++) {
        const child = children[index];
        if (child.__frameworkVersion !== this.project.__frameworkVersion) {
          await child.__setFramworkVersion(this.project.__frameworkVersion);
        }
      }
    }

    if (this.project.__isStandaloneProject || this.project.__isSmartContainerChild) {
      await this.project.__branding.apply(!!branding);
    }

    this.project.quickFixes.missingAngularLibFiles();
    if (this.project.__isTnp) { // TODO make it for standalone
      this.project.quickFixes.overritenBadNpmPackages();

    }
    if (this.project.__isStandaloneProject || this.project.__isContainer) {
      this.project.quickFixes.missingLibs([])
    }

    if (this.project.__isStandaloneProject) {

      Helpers.taskStarted(`Initing project: ${chalk.bold(this.project.genericName)}`);
      Helpers.log(` (from locaiton: ${this.project.location})`);
      Helpers.log(`Init mode: ${websql ? '[WEBSQL]' : ''}`)
    }

    alreadyInitedPorjects.push(this.project)
    Helpers.log(`Push to alread inited ${this.project.genericName} from ${this.project.location} `)

    //#region handle init of container
    if (this.project.__isContainer) {
      await this.project.__recreate.init();

      if (!this.project.__isContainerWithLinkedProjects) {
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
          await containerChild.__filesStructure.init(options);
          const containerChildChildren = containerChild.children;
          for (let indexChild = 0; indexChild < containerChildChildren.length; indexChild++) {
            const workspaceChild = containerChildChildren[indexChild];
            await workspaceChild.__filesStructure.init(options)
          }
        }
      }

    }
    //#endregion

    await this.project.__recreate.init();
    this.project.__recreate.vscode.settings.toogleHideOrShowDeps();

    if (this.project.__isStandaloneProject || this.project.__isSmartContainer) {
      await this.project.__env.init();
      this.project.__filesTemplatesBuilder.rebuild();
    }

    if (!this.project.__node_modules.exist && !struct) {
      await this.project.__npmPackages.installProcess(`inti procedure of ${this.project.name} `);
    }
    this.project.__packageJson.showDeps(`Show new deps for ${this.project.__frameworkVersion} `);
    //#region handle node modules instalation
    if (!this.project.__isDocker) {
      if (this.project.__isContainerCoreProject && this.project.__frameworkVersionEquals('v1')) {
        this.project.quickFixes.overritenBadNpmPackages();
      }
    }
    //#endregion

    this.project.quickFixes.removeTnpFromItself();

    const smartContainerBuildTarget = (
      this.project.__isSmartContainerChild
        ? this.project?.parent.__smartContainerBuildTarget
        : (this.project.__isSmartContainer ? this.project.__smartContainerBuildTarget : void 0)
    )


    if (this.project.__isSmartContainer) {
      //#region handle smart container
      Helpers.writeFile([this.project.location, 'angular.json'], this.angularJsonContainer);
      await this.project.__recreate.init();
      await this.project.__singluarBuild.init(watch, false, 'dist', smartContainerTargetName);
      //#endregion
    }

    this.project.quickFixes.missingSourceFolders();

    this.project.quickFixes.badTypesInNodeModules();
    Helpers.log(`Init DONE for project: ${chalk.bold(this.project.genericName)} `);
  }


  private async recrusiveOperation(proj: Project, recrusive = false, type: keyof Project) {

    if (type === 'clear') {
      await proj.clear()
    }
    if (recrusive) {
      for (let index = 0; index < proj.children.length; index++) {
        const c = proj.children[index];
        await this.recrusiveOperation(c, recrusive, type)
      }
    }
  }

  public async clear(options?: { recrusive: boolean; }) {
    if (this.project.__isVscodeExtension) {
      Helpers.remove(this.project.pathFor('out'), true)
    }
    let { recrusive = false } = options || {};
    if (this.project.__isSmartContainer) {
      recrusive = true;
    }
    await this.recrusiveOperation(this.project, recrusive, 'clear')
  }

  private resolveArgs(args: string) {
    let { recrusive = false, r = false } = require('minimist')(args.split(' '));
    recrusive = (recrusive || r);
    return { recrusive }
  }



  async clearFromArgs(args) {
    const { recrusive } = this.resolveArgs(args);
    if (this.project.__npmPackages.useSmartInstall) {
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
            // "test": {
            //   "builder": "@angular-devkit/build-angular:karma",
            //   "options": {
            //     "main": "src/test.ts",
            //     "polyfills": "src/polyfills.ts",
            //     "tsConfig": "tsconfig.spec.json",
            //     "karmaConfig": "karma.conf.js",
            //     "inlineStyleLanguage": "scss",
            //     "assets": [
            //       "src/favicon.ico",
            //       "src/assets"
            //     ],
            //     "styles": [
            //       "src/styles.scss"
            //     ],
            //     "scripts": []
            //   }
            // }
          }
        }
      },
      "defaultProject": "sassy-project"
    }


  }

}
