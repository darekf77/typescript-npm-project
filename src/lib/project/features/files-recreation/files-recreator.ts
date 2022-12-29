//#region @backend

//#region imports
import { fse, crossPlatformPath } from 'tnp-core'
import { path } from 'tnp-core'
import { _ } from 'tnp-core';
import { Project } from '../../abstract';
import { Models } from 'tnp-models';
import { FiredevModels, Helpers } from 'tnp-helpers';
import { config, ConfigModels } from 'tnp-config';
import { HelpersMerge } from 'tnp-helpers';
import { FeatureForProject } from '../../abstract';
import { BuildOptions } from 'tnp-db';
import * as JSON5 from 'json5';
//#endregion

export class FilesRecreator extends FeatureForProject {

  //#region fields & getters

  //#region fields & getters / common files for all projects
  private get commonFilesForAllProjects() {
    return [
      '.npmrc',
      'tslint.json',
      '.editorconfig'
    ];
  }
  //#endregion

  //#region fields & getters  / files ignored by
  get filesIgnoredBy() {
    const self = this;
    return {
      get vscodeSidebarFilesView() {
        // const siteFiles = ['src', 'components'];
        return self.filesIgnoredBy.gitignore
          .concat([
            '.gitignore',
            '.npmignore',
            '.npmrc',
            '.babelrc',
            'package.json_devDependencies.json',
            'package.json',
            'docs',
            'logo.svg',
            // ...(self.project.isWorkspace ? self.project.children.map(c => c.name) : [])
          ])
          .map(f => f.startsWith('/') ? f.slice(1) : f)
        // .filter(f => {
        //   // console.log('f',siteFiles)
        //   if (self.project.isSiteInStrictMode && siteFiles.includes(f)) {
        //     return false
        //   }
        //   return true;
        // })
      },
      get gitignore() {
        const gitignoreFiles = [ // for sure ingored
          config.folder.node_modules,
          'tmp*',
          'dist*',
          'bundle*',
          'browser',
          'browser*',
          'websql',
          'websql*',
          'module*',
          'backup',
          'module',
          'www'
        ].concat([ // common small files
          'Thumbs.db',
          '.DS_Store',
          '**/.DS_Store',
          'npm-debug.log*'
        ].concat([ // not sure if ignored/needed
          '.sass-cache',
          '.sourcemaps'
        ])
          .concat((self.project.isSiteInStrictMode && self.project.isGeneratingControllerEntities) ? [
            path.join(config.folder.custom, config.folder.src, config.file.entities_ts),
            path.join(config.folder.custom, config.folder.src, config.file.controllers_ts)
          ] : [])
          .concat(self.project.filesTemplates().map(f => f.replace('.filetemplate', '')))
          .concat(self.project.typeIs('angular-lib') ? [
            'components/tsconfig.json',
            'src/tsconfig.app.json'
          ] : [])
          .concat(self.project.linkedFolders
            .map(l => l.to?.replace(/^\.\//, ''))
            .filter(f => !!f)
          )
          .concat( // for site ignore auto-generate scr
            self.project.isSiteInStrictMode ? (
              self.project.customizableFilesAndFolders
                .concat(self.project.customizableFilesAndFolders.map(f => {
                  return Helpers.path.PREFIX(f);
                }))
                .concat(self.project.customizableFilesAndFolders.map(f => {
                  return `!${path.join(config.folder.custom, f)}`
                }))
            ) : []
          )).concat( // common files for all project
            self.project.isCoreProject ? [] : self.commonFilesForAllProjects
          ).concat( // core files of projects types
            self.project.isCoreProject ? [] : self.project.projectSpecyficFiles().filter(f => {
              return !self.project.recreateIfNotExists().includes(f);
            })
          ).concat( // core files of projects types
            !self.project.isCoreProject ? [] : [
              config.folder.src,
              config.folder.components,
            ].map(f => `${f}-for-stanalone`)
          )
          .concat((!self.project.isStandaloneProject && !self.project.isCoreProject) ? self.project.projectSpecyficIgnoredFiles() : [])
          .concat(self.project.isTnp ? ['projects/tmp*'] : [])
          .concat([
            'tsconfig.backend.dist.json',
            'tsconfig.backend.bundle.json',
          ])
        // .concat(self.project.isContainer ? [
        //   ...(self.project.children.filter(c => c.git.isGitRepo).map(c => c.name))
        // ] : []);

        // console.log('self.project:', self.project.name);
        // console.log(gitignoreFiles)
        return gitignoreFiles.map(f => `/${crossPlatformPath(f)}`)
      },
      get npmignore() {
        const allowedProject: ConfigModels.LibType[] = ['isomorphic-lib', 'angular-lib']
        const canBeUseAsNpmPackage = self.project.typeIs(...allowedProject);
        const npmignoreFiles = [
          '.vscode',
          'dist/',
          'src/',
          '/docs',
          '/preview',
          '/tests',
          'tsconfig.json',
          'npm-debug.log*'
        ].concat(self.commonFilesForAllProjects)

        return npmignoreFiles.map(f => crossPlatformPath(f))
      }
    }
  }
  //#endregion

  //#region fields & getters  / vscode
  get vscode() {
    const self = this;
    return {
      get settings() {
        return {
          hideOrShowDeps() {
            let action: 'hide' | 'show' | 'nothing';
            self.modifyVscode((settings) => {
              const exclude = settings['files.exclude'];
              if (!exclude) {
                settings['files.exclude'] = {};
              }
              if (Object.keys(settings['files.exclude']).length === 0) {
                action = 'show';
              } else {
                action = 'hide';
              }
              return settings;
            });
            if (action === 'hide') {
              Helpers.log(`Auto hiding while init`);
              self.vscode.settings.excludedFiles(true);
            }
            if (action === 'show') {
              Helpers.info(`Auto showing while init`);
              self.vscode.settings.excludedFiles(false);
            }
          },
          gitReset() {
            try {
              self.project.run('git checkout HEAD -- .vscode/settings.json').sync()
            } catch (e) { }

          },
          changeColorTheme(white = true) {
            self.modifyVscode((settings) => {
              settings['workbench.colorTheme'] = white ? 'Default Light+' : 'Kimbie Dark';
              return settings;
            });
          },

          colorsFromWorkspace() {
            self.modifyVscode((settings, project) => {

              if (project.isWorkspaceChildProject) {

                if (!settings['workbench.colorCustomizations']) {
                  settings['workbench.colorCustomizations'] = {};
                }

                // update activity bar color
                const parentSettings = Helpers.vscode.getSettingsFrom(project.parent);
                const statuBarColor = parentSettings &&
                  parentSettings['workbench.colorCustomizations'] &&
                  parentSettings['workbench.colorCustomizations']['statusBar.background'];
                settings['workbench.colorCustomizations']['statusBar.background'] = statuBarColor;
                settings['workbench.colorCustomizations']['statusBar.debuggingBackground'] = statuBarColor;

                // update background color
                if (project.isSite) {
                  const baselineColor = Helpers.vscode.getSettingsFrom(project.baseline);
                  const activityBarBcg = baselineColor &&
                    baselineColor['workbench.colorCustomizations'] &&
                    baselineColor['workbench.colorCustomizations']['activityBar.background'];
                  settings['workbench.colorCustomizations']['activityBar.background'] = activityBarBcg;
                  settings['workbench.colorCustomizations']['statusBar.background'] = activityBarBcg;
                }

              }

              return settings;
            });
          },

          excludedFiles(hide: boolean = true) {
            self.modifyVscode(settings => {
              settings['files.exclude'] = {};

              const getSettingsFor = (project: Project, s = {}) => {

                s['files.exclude'] = {};

                s['files.exclude'][`**/*____ORIGINAL____.ts`] = true;

                s['files.exclude']['tsconfig.backend.dist.json'] = true;
                s['files.exclude']['tsconfig.backend.bundle.json'] = true;
                s['files.exclude']['tsconfig.backend.dist.json.filetemplate'] = true;
                s['files.exclude']['tsconfig.backend.bundle.json.filetemplate'] = true;

                if (project.isVscodeExtension) {
                  s['files.exclude']["out"] = true;
                  s['files.exclude']["update-proj.js"] = true;
                  s['files.exclude'][".vscodeignore"] = true;
                  s['files.exclude']["*.vsix"] = true;
                }
                if (project.isTnp) {
                  project.node_modules.fixesForNodeModulesPackages.forEach(p => {
                    s['files.exclude'][p] = true;
                  })
                  // s['files.exclude']["*.js"] = true;
                  // s['files.exclude']["environment.js"] = false;
                  s['files.exclude']["*.sh"] = true;
                  s['files.exclude']["*.xlsx"] = true;
                  s['files.exclude']["scripts"] = true;
                  // s['files.exclude']["bin"] = true;
                }
                project.projectLinkedFiles().forEach(({ relativePath }) => {
                  s['files.exclude'][relativePath] = true;
                }),
                  [
                    ...self.filesIgnoredBy.vscodeSidebarFilesView,
                    ...(
                      Helpers.exists([self.project.location, config.file.package_json__tnp_json5])
                        ? [config.file.package_json__tnp_json]
                        : []
                    )
                  ].map(f => {
                    s['files.exclude'][f] = true;
                  })
                if (project.isCoreProject) {
                  s['files.exclude']["**/*.filetemplate"] = true;
                  s['files.exclude']["**/tsconfig.*"] = true;
                  s['files.exclude']["tslint.*"] = true;
                  s['files.exclude']["index.*"] = true;
                  s['files.exclude']["package-lock.json"] = true;
                  s['files.exclude']["protractor.conf.js"] = true;
                  s['files.exclude']["karma.conf.js"] = true;
                  s['files.exclude'][".editorconfig"] = true;
                  project.vscodeFileTemplates.forEach(f => {
                    s['files.exclude'][f.replace('.filetemplate', '')] = false;
                  });
                }
                return s;
              }

              if (hide) {
                settings = getSettingsFor(self.project, settings) as any;
                if (self.project.isWorkspace || self.project.isSmartContainer) {

                  if (self.project.isSmartContainer) {
                    settings['files.exclude'][`recent.json`] = true;
                    settings['files.exclude'][`angular.json`] = true;
                    // settings['files.exclude'][`src/lib`] = true;
                  }

                  self.project.children.forEach(c => {
                    const childernSettings = getSettingsFor(c);
                    Object.keys(childernSettings['files.exclude']).forEach(k => {
                      settings['files.exclude'][`${c.name}/${k}`] = childernSettings['files.exclude'][k]
                    })
                    settings['files.exclude'][`${c.name}/tsconfig*`] = true;
                    settings['files.exclude'][`${c.name}/webpack*`] = true;
                    settings['files.exclude'][`${c.name}/index*`] = true;
                    settings['files.exclude'][`${c.name}/run.js`] = true;

                    settings['files.exclude'][`${c.name}/src/index.ts`] = true;
                    settings['files.exclude'][`${c.name}/.vscode`] = true;
                    // settings['files.exclude'][`${c.name}/${config.file.package_json__tnp_json5}`] = true;
                    settings['files.exclude'][`${c.name}/${config.file.package_json}`] = true;
                    // settings['files.exclude'][`${c.name}/src/lib`] = true;
                    // settings['files.exclude'][`${c.name}/README.md`] = true;
                    settings['files.exclude'][`${c.name}/karma.conf.js*`] = true;
                    settings['files.exclude'][`${c.name}/protractor.conf.js*`] = true;
                    c.filesTemplates().forEach(t => {
                      settings['files.exclude'][`${c.name}/${t}`] = true;
                      settings['files.exclude'][`${c.name}/${t.replace('.filetemplate', '')}`] = true;
                    });
                  })
                }



              }
              // settings['files.exclude'][config.folder.tmpTestsEnvironments] = false;

              return settings
            });
          }
        }
      }
    }



  }
  //#endregion

  //#endregion

  //#region api

  //#region api / init
  public async init(buildOptions: BuildOptions) {
    Helpers.log('recreation init')
    if (this.project.typeIs('container')) {
      this.writeGitignore();
      this.handleProjectSpecyficFiles();
      return;
    }

    if (this.project.frameworkVersionAtLeast('v3') && this.project.typeIs('isomorphic-lib') && !this.project?.parent?.isSmartContainer) {
      if (buildOptions.outDir) {
        await this.project.insideStructure.recrate(buildOptions);
      } else {
        await this.project.insideStructure.recrate(BuildOptions.fromJson(_.merge(buildOptions, { outDir: 'dist' } as BuildOptions)));
        await this.project.insideStructure.recrate(BuildOptions.fromJson(_.merge(buildOptions, { outDir: 'bundle' } as BuildOptions)));
      }
    }

    this.handleProjectSpecyficFiles();
    this.writeGitignore();
    this.writeNpmignore();
    Helpers.log('recreation end')

  }
  //#endregion

  //#region api / init vscode
  initVscode() {
    this.vscode.settings.excludedFiles(true);
    this.vscode.settings.colorsFromWorkspace();
  }
  //#endregion

  //#endregion

  //#region methods

  //#region methods / modify vscode
  private modifyVscode(modifyFN: (settings: FiredevModels.VSCodeSettings, project?: Project) => FiredevModels.VSCodeSettings) {
    const pathSettingsVScode = path.join(this.project.location, '.vscode', 'settings.json');
    Helpers.log('[modifyVscode] setting things...')
    if (this.project.isSite) {
      if (!fse.existsSync(pathSettingsVScode)) {
        Helpers.mkdirp(path.dirname(pathSettingsVScode));
        const settingsFromBaseline = path.join(this.project.baseline.location, '.vscode', 'settings.json');
        if (fse.existsSync(settingsFromBaseline)) {
          fse.copyFileSync(settingsFromBaseline, pathSettingsVScode);
        }
      }
    }
    if (Helpers.exists(pathSettingsVScode)) {
      try {
        Helpers.log('parsing 1 ...')
        let settings: FiredevModels.VSCodeSettings = JSON5.parse(Helpers.readFile(pathSettingsVScode))
        settings = modifyFN(settings, this.project);
        Helpers.writeFile(pathSettingsVScode, settings);
      } catch (e) {
        Helpers.log(e)
      }
    } else {
      try {
        Helpers.log('parsing 2...')
        const settingFromCore = path.join(Project.by<Project>(this.project._type).location, '.vscode', 'settings.json');
        Helpers.mkdirp(path.dirname(pathSettingsVScode));
        if (Helpers.exists(settingFromCore)) {
          var settings: FiredevModels.VSCodeSettings = JSON5.parse(Helpers.readFile(settingFromCore))
          settings = modifyFN(settings, this.project);
          Helpers.writeFile(pathSettingsVScode, settings)
        }
      } catch (e) {
        Helpers.log(e)
      }
    }
  }
  //#endregion

  //#region methods / write npm ignore
  private writeNpmignore() {
    Helpers.writeFile(path.join(this.project.location, '.npmignore'),
      this.filesIgnoredBy.npmignore.join('\n').concat('\n'));
  }
  //#endregion

  //#region methods / write git ignore
  private writeGitignore() {

    const coreFiles = !this.project.isCoreProject ? [] : this.project.projectLinkedFiles()
      .map(({ relativePath }) => {
        return `/${relativePath}`;
      })
      .join('\n');

    const ignoredByGit = this.filesIgnoredBy
      .gitignore
      .filter(f => {
        if (this.project.isCoreProject && f.endsWith('.filetemplate')) {
          return false;
        }
        return true;
      }).join('\n').concat('\n');
    // console.log(ignoredByGit)

    Helpers.writeFile(path.join(this.project.location, '.gitignore'),
      `# profiling files
chrome-profiler-events*.json
speed-measure-plugin*.json

# misc
/.sass-cache
/connect.lock
/coverage
/libpeerconnection.log
npm-debug.log
yarn-error.log
testem.log
/typings
${this.project.linkedRepos.git.ignored()}
${this.project.isStandaloneProject ? `/${config.folder.testsEnvironments}` : ''}

# System Files
.DS_Store
Thumbs.db
${this.project.isVscodeExtension ? '/*.vsix' : ''}
${this.project.isVscodeExtension ? '/out' : ''}
`+ ignoredByGit + `
${this.project.isTnp ? '!tsconfig*' : ''}
${this.project.isTnp ? 'webpack.*' : ''}
${this.project.isContainerOrWorkspaceWithLinkedProjects ? `
# container/workspace git projects
${this.project.isMonorepo ? [] : this.project.packageJson.linkedProjects.map(c => `/${crossPlatformPath(c)}`).join('\n')}
` : []}
# =====================
${this.project.isCoreProject ? '!*.filetemplate' : '*.filetemplate'}
${this.project.isDocker ? '!Dockerfile.filetemplate' : ''}
${this.project.isSmartContainer ? '/angular.json' : ''}
${coreFiles}

`.trimRight() + '\n');


  }
  //#endregion

  //#region methods / handle project specyfic files
  private handleProjectSpecyficFiles() {

    const linkedFolder = this.project.linkedFolders;
    linkedFolder.forEach((c) => {
      const from = crossPlatformPath(path.resolve(path.join(this.project.location, c.from)));
      const to = crossPlatformPath(path.resolve(path.join(this.project.location, c.to)));
      if (Helpers.exists(from) && (to.search(this.project.location) !== -1)) {
        Helpers.removeIfExists(to);
        Helpers.createSymLink(from, to);
        Helpers.info(`Linked folder ${path.basename(from)} to ./${to.replace(this.project.location, '')}`);
      } else {
        Helpers.warn(`Not able to link folders:
      from: ${from}
      to: ${to}

      `)
      }

    });

    let defaultProjectProptotype: Project;

    if (this.project.frameworkVersionAtLeast('v3') && this.project.typeIsNot('isomorphic-lib')) {
      // nothing here
    } else {
      defaultProjectProptotype = Project.by<Project>(this.project._type, this.project._frameworkVersion) as Project;
    }

    const files: Models.other.RecreateFile[] = [];

    if (crossPlatformPath(this.project.location) === crossPlatformPath(defaultProjectProptotype?.location)) {
      Helpers.info(`LINKING CORE PROJCET ${this.project.name} ${this.project._type} ${this.project._frameworkVersion}`)
      if (this.project.frameworkVersionAtLeast('v3') && this.project.typeIsNot('isomorphic-lib')) {
        // nothing
      } else {
        const toLink = defaultProjectProptotype.projectLinkedFiles()
        toLink.forEach(c => {
          Helpers.info(`[LINKING] ${c.relativePath} from ${c.sourceProject.location}  `);
          Helpers.createSymLink(path.join(c.sourceProject.location, c.relativePath), path.join(this.project.location, c.relativePath));
        });
      }
    } else if (defaultProjectProptotype) {
      const projectSpecyficFilesLinked = this.project.projectSpecyficFilesLinked();
      const projectSpecyficFiles = this.project.projectSpecyficFiles();
      projectSpecyficFiles.forEach(f => {
        let from = path.join(defaultProjectProptotype.location, f);

        if (!Helpers.exists(from)) {

          const linked = defaultProjectProptotype.projectLinkedFiles().find(a => a.relativePath === f);
          if (linked) {
            Helpers.warn(`[firedev]]FIXING LINKED projects`);
            Helpers.createSymLink(
              path.join(linked.sourceProject.location, linked.relativePath),
              path.join(defaultProjectProptotype.location, f));
          } else if (defaultProjectProptotype.frameworkVersionAtLeast('v2')) {
            const core = Project.by<Project>(
              defaultProjectProptotype._type,
              defaultProjectProptotype.frameworkVersionMinusOne
            );
            from = path.join(core.location, f);
          }

        }

        const where = path.join(this.project.location, f);

        if (this.project.recreateIfNotExists().includes(f) && Helpers.exists(where)) {
          return;
        }

        files.push({
          linked: projectSpecyficFilesLinked.includes(f),
          from,
          where,
        });
      });
      files.forEach(file => {
        if (file.linked) {
          Helpers.info(`Linking: ${file.from}`)
          Helpers.removeFileIfExists(file.where);
          Helpers.createSymLink(file.from, file.where);
        } else {
          Helpers.copyFile(file.from, file.where);
        }
      });
    }

  }
  //#endregion


  //#endregion


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



//#endregion
