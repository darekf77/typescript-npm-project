//#region @backend
import { fse, crossPlatformPath } from 'tnp-core/src'
import { path } from 'tnp-core/src'
import * as JSON5 from 'json5';
import { glob } from 'tnp-core/src';
import { _ } from 'tnp-core/src';
// local
import { Project } from '../../abstract/project/project';
import { Models } from 'tnp-models/src';
import { Helpers } from 'tnp-helpers/src';
import { config, ConfigModels } from 'tnp-config/src';
import { FeatureForProject } from '../../abstract/feature-for-project';
import { CLI } from 'tnp-cli/src';



function getVscodeSettingsFrom(project: Project) {
  let settings: ConfigModels.VSCodeSettings;
  const pathSettingsVScode = path.join(project.location, '.vscode', 'settings.json')
  if (Helpers.exists(pathSettingsVScode)) {
    settings = JSON5.parse(Helpers.readFile(pathSettingsVScode))
  }
  return settings;
}



export class FilesRecreator extends FeatureForProject {

  public async init() {
    Helpers.log(`recreation init of ${CLI.chalk.bold(this.project.genericName)}`)
    if (this.project.typeIs('container')) {
      this.gitignore();
      this.handleProjectSpecyficFiles();
      return;
    }

    if (this.project.frameworkVersionAtLeast('v3') && this.project.typeIs('isomorphic-lib') && !this.project?.parent?.isSmartContainer) {
      await this.project.insideStructure.recrate('dist');
    }

    this.handleProjectSpecyficFiles();
    this.commonFiles();

    this.gitignore();
    this.npmignore();
    Helpers.log('recreation end')

  }

  initVscode() {
    this.vscode.settings.hideOrShowFilesInVscode(true);
  }


  private get commonFilesForAllProjects() {
    return [
      '.npmrc',
      'tslint.json',
      '.editorconfig'
    ];
  }

  get filesIgnoredBy() {
    const self = this;
    return {
      get vscodeSidebarFilesView() {
        // const siteFiles = ['src', 'components'];
        return self.filesIgnoredBy.gitignore
          .concat([
            '.gitignore',
            '.npmignore',
            // '.npmrc',
            '.babelrc',
            'package.json_devDependencies.json',
            ...(  // TODO or firedev json
              Helpers.exists(self.project.pathFor(config.file.package_json__tnp_json))
                ? [config.file.package_json]
                : []
            ),
            // 'docs',
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
          .concat(self.project.filesTemplates().map(f => f.replace('.filetemplate', '')))
          .concat(self.project.linkedFolders
            .map(l => l.to?.replace(/^\.\//, ''))
            .filter(f => !!f)
          ))
          .concat( // common files for all project
            self.project.isCoreProject ? [] : self.commonFilesForAllProjects
          ).concat( // core files of projects types
            self.project.isCoreProject ? [] : self.project.projectSpecyficFiles().filter(relativeFilePath => {
              return !self.project.recreateIfNotExists().includes(relativeFilePath);
            })
          ).concat( // core files of projects types
            !self.project.isCoreProject ? [] : [
              config.folder.src,
              config.folder.components,
            ].map(f => `${f}-for-stanalone`)
          )
          .concat((!self.project.isStandaloneProject && !self.project.isCoreProject)
            ? self.project.projectSpecyficIgnoredFiles() : [])
          .concat(self.project.isTnp ? ['projects/tmp*'] : [])
          .concat([
            'tsconfig.backend.dist.json'
          ])
        // .concat(self.project.isContainer ? [
        //   ...(self.project.children.filter(c => c.git.isGitRepo).map(c => c.name))
        // ] : []);

        // console.log('self.project:', self.project.name);
        // console.log(gitignoreFiles)
        return gitignoreFiles.map(f => `/${crossPlatformPath(f)}`)
      },
      get npmignore() {
        const allowedProject: ConfigModels.LibType[] = ['isomorphic-lib']
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



  private modifyVscode(modifyFN: (settings: ConfigModels.VSCodeSettings, project?: Project) => ConfigModels.VSCodeSettings) {
    const pathSettingsVScode = path.join(this.project.location, '.vscode', 'settings.json');

    Helpers.log('[modifyVscode] setting things...')
    if (Helpers.exists(pathSettingsVScode)) {
      try {
        Helpers.log('parsing 1 ...')
        let settings: ConfigModels.VSCodeSettings = JSON5.parse(Helpers.readFile(pathSettingsVScode))
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
          var settings: ConfigModels.VSCodeSettings = JSON5.parse(Helpers.readFile(settingFromCore))
          settings = modifyFN(settings, this.project);
          Helpers.writeFile(pathSettingsVScode, settings)
        }
      } catch (e) {
        Helpers.log(e)
      }
    }
  }

  get vscode() {
    const self = this;
    return {
      get settings() {
        return {
          toogleHideOrShowDeps() {
            let action: 'hide' | 'show' | 'nothing';
            self.modifyVscode((settings) => {

              settings['search.exclude'] = {
                'docs': true,
                'projects': true,
                'bin': true,
              };

              if (!settings['files.exclude']) {
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
              self.vscode.settings.hideOrShowFilesInVscode(true);
            }
            if (action === 'show') {
              Helpers.log(`Auto showing while init`);
              self.vscode.settings.hideOrShowFilesInVscode(false);
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
          hideOrShowFilesInVscode(hide: boolean = true) {
            self.modifyVscode(settings => {
              settings['files.exclude'] = {};

              const getSettingsFor = (project: Project, s = {}) => {

                s['files.exclude'] = {};

                s['files.exclude'][`**/*____ORIGINAL____.ts`] = true;
                s['files.exclude'][`_changelog`] = true;

                s['files.exclude']['tsconfig.backend.dist.json'] = true;
                s['files.exclude']['tsconfig.backend.dist.json.filetemplate'] = true;

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
                if (self.project.isSmartContainer) {

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
                    settings['files.exclude'][`${c.name}/run-org.js`] = true;

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

  npmignore() {
    Helpers.writeFile(path.join(this.project.location, '.npmignore'),
      this.filesIgnoredBy.npmignore.join('\n').concat('\n'));
  }

  gitignore() {

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
app.hosts.ts
${this.project.linkedRepos.git.ignored()}
${this.project.isStandaloneProject ? `/${config.folder.testsEnvironments}` : ''}
/src/lib/lib-info.md
/src/migrations/migrations-info.md
/src/tests/mocha-tests-info.md
/src/assets/shared/shared_folder_info.txt

# System Files
.DS_Store
Thumbs.db
${this.project.isVscodeExtension ? '/*.vsix' : ''}
${this.project.isVscodeExtension ? '/out' : ''}
`+ ignoredByGit + `
${(this.project.isTnp || this.project.isVscodeExtension) ? '!tsconfig*' : ''}
${this.project.isTnp ? 'webpack.*' : ''}
${this.project.isContainerOrWorkspaceWithLinkedProjects ? `
# container/workspace git projects
${this.project.isMonorepo ? [] : this.project.packageJson.linkedProjects.map(c => `/${crossPlatformPath(c)}`).join('\n')}
` : []}
# =====================
${this.project.isCoreProject ? '!*.filetemplate' : '*.filetemplate'}
${this.project.isDocker ? '!Dockerfile.filetemplate' : ''}
${this.project.isSmartContainer ? '/angular.json' : ''}
${this.project.isVscodeExtension ? '' : coreFiles}
/.vscode/launch.json

`.trimRight() + '\n');


  }



  handleProjectSpecyficFiles() {

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


    defaultProjectProptotype = Project.by<Project>(this.project._type, this.project._frameworkVersion) as Project;

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
      // console.log({
      //   projectSpecyficFiles,
      //   project: this.project.genericName
      // })
      projectSpecyficFiles.forEach(relativeFilePath => {
        relativeFilePath = crossPlatformPath(relativeFilePath);
        let from = crossPlatformPath(path.join(defaultProjectProptotype.location, relativeFilePath));

        if (!Helpers.exists(from)) {

          const linked = defaultProjectProptotype.projectLinkedFiles().find(a => a.relativePath === relativeFilePath);
          if (linked) {
            Helpers.warn(`[firedev]]FIXING LINKED projects`);
            Helpers.createSymLink(
              path.join(linked.sourceProject.location, linked.relativePath),
              path.join(defaultProjectProptotype.location, relativeFilePath));
          } else if (defaultProjectProptotype.frameworkVersionAtLeast('v2')) {
            const core = Project.by<Project>(
              defaultProjectProptotype._type,
              defaultProjectProptotype.frameworkVersionMinusOne
            );
            from = crossPlatformPath(path.join(core.location, relativeFilePath));
          }

        }

        const where = crossPlatformPath(path.join(this.project.location, relativeFilePath));

        if (this.project.recreateIfNotExists().includes(relativeFilePath) && Helpers.exists(where)) {
          return;
        }

        files.push({
          linked: projectSpecyficFilesLinked.includes(relativeFilePath),
          from,
          where,
        });
      });
      files.forEach(file => {
        if (file.linked) {
          Helpers.info(`Linking: ${file.from}`)
          Helpers.removeFileIfExists(file.where);
          Helpers.createSymLink(file.from, file.where, { continueWhenExistedFolderDoesntExists: true });
        } else {
          Helpers.copyFile(file.from, file.where);
        }
      });
    }

  }

  commonFiles() {
    const wokrspace = Project.by<Project>('container', this.project._frameworkVersion);

    const files = this.commonFilesForAllProjects;
    files.map(file => {
      return {
        from: path.join(wokrspace.location, file),
        where: path.join(this.project.location, file)
      }
    }).forEach(file => {
      Helpers.copyFile(file.from, file.where);
    })
  }


}



//#endregion
