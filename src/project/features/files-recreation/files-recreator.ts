//#region @backend
import * as fse from 'fs-extra';
import * as path from 'path';
import * as JSON5 from 'json5';
import * as glob from 'glob';
import * as _ from 'lodash';
// local
import { Project } from '../../abstract';
import { Models } from 'tnp-models';
import { Helpers } from 'tnp-helpers';
import { config } from 'tnp-config';
import { HelpersMerge } from 'tnp-helpers';
import { FeatureForProject } from '../../abstract';

interface VSCodeSettings {
  'files.exclude': { [files: string]: boolean; };
  'workbench.colorTheme': 'Default Light+' | 'Kimbie Dark',
  'workbench.colorCustomizations': {
    'activityBar.background'?: string;
    'activityBar.foreground'?: string;
    'statusBar.background'?: string;
  }
}


function getVscodeSettingsFrom(project: Project) {
  let settings: VSCodeSettings;
  const pathSettingsVScode = path.join(project.location, '.vscode', 'settings.json')
  if (Helpers.exists(pathSettingsVScode)) {
    settings = JSON5.parse(Helpers.readFile(pathSettingsVScode))
  }
  return settings;
}



export class FilesRecreator extends FeatureForProject {

  public async init() {
    if (this.project.typeIs('container')) {
      // console.log('GIGIIGIGII')
      this.gitignore();
      this.handleProjectSpecyficFiles();
      return;
    }
    this.initAssets();
    this.handleProjectSpecyficFiles();
    this.commonFiles();

    this.gitignore();
    this.npmignore();
    this.customFolder();
  }

  private get commonFilesForAllProjects() {
    return [
      '.npmrc',
      'tslint.json',
      '.editorconfig'
    ]
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
            '.npmrc',
            '.babelrc',
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
                  return HelpersMerge.PathHelper.PREFIX(f);
                }))
                .concat(self.project.customizableFilesAndFolders.map(f => {
                  return `!${path.join(config.folder.custom, f)}`
                }))
            ) : []
          )).concat( // common files for all project
            self.project.isCoreProject ? [] : self.commonFilesForAllProjects
          ).concat( // core files of projects types
            self.project.isCoreProject ? [] : self.project.projectSpecyficFiles()
          ).concat( // core files of projects types
            !self.project.isCoreProject ? [] : [
              config.folder.src,
              config.folder.components,
            ].map(f => `${f}-for-stanalone`)
          )
          .concat(self.project.isWorkspaceChildProject ? [
            ...self.assetsToIgnore,
            // 'src/assets/*/*'
          ] : [])
          .concat((!self.project.isStandaloneProject && !self.project.isCoreProject) ? self.project.projectSpecyficIgnoredFiles() : [])
          .concat(self.project.isTnp ? ['projects/tmp*'] : [])
        // .concat(self.project.isContainer ? [
        //   ...(self.project.children.filter(c => c.git.isGitRepo).map(c => c.name))
        // ] : []);

        // console.log('self.project:', self.project.name);
        // console.log(gitignoreFiles)
        return gitignoreFiles.map(f => `/${f}`)
      },
      get npmignore() {
        const allowedProject: Models.libs.LibType[] = ['isomorphic-lib', 'angular-lib']
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

        return npmignoreFiles;
      }
    }
  }



  private modifyVscode(modifyFN: (settings: VSCodeSettings, project?: Project) => VSCodeSettings) {
    const pathSettingsVScode = path.join(this.project.location, '.vscode', 'settings.json')
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
        let settings: VSCodeSettings = JSON5.parse(Helpers.readFile(pathSettingsVScode))
        settings = modifyFN(settings, this.project);
        Helpers.writeFile(pathSettingsVScode, settings);
      } catch (e) {
        Helpers.log(e)
      }
    } else {
      try {
        const settingFromCore = path.join(Project.by<Project>(this.project._type).location, '.vscode', 'settings.json');
        Helpers.mkdirp(path.dirname(pathSettingsVScode));
        if (Helpers.exists(settingFromCore)) {
          var settings: VSCodeSettings = JSON5.parse(Helpers.readFile(settingFromCore))
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
                const parentSettings = getVscodeSettingsFrom(project.parent);
                const statuBarColor = parentSettings &&
                  parentSettings['workbench.colorCustomizations'] &&
                  parentSettings['workbench.colorCustomizations']['statusBar.background'];
                settings['workbench.colorCustomizations']['statusBar.background'] = statuBarColor;
                settings['workbench.colorCustomizations']['statusBar.debuggingBackground'] = statuBarColor;

                // update background color
                if (project.isSite) {
                  const baselineColor = getVscodeSettingsFrom(project.baseline);
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
                if (project.isTnp) {
                  project.node_modules.fixesForNodeModulesPackages.forEach(p => {
                    s['files.exclude'][p] = true;
                  })
                  // s['files.exclude']["*.js"] = true;
                  // s['files.exclude']["environment.js"] = false;
                  s['files.exclude']["*.sh"] = true;
                  s['files.exclude']["*.xlsx"] = true;
                  s['files.exclude']["scripts"] = true;
                  s['files.exclude']["bin"] = true;
                }
                project.projectLinkedFiles().forEach(({ relativePath }) => {
                  s['files.exclude'][relativePath] = true;
                })
                self.filesIgnoredBy.vscodeSidebarFilesView.map(f => {
                  s['files.exclude'][f] = true
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
                if (self.project.isWorkspace) {
                  self.project.children.forEach(c => {
                    const childernSettings = getSettingsFor(c);
                    Object.keys(childernSettings['files.exclude']).forEach(k => {
                      settings['files.exclude'][`${c.name}/${k}`] = childernSettings['files.exclude'][k]
                    })
                    settings['files.exclude'][`${c.name}/tsconfig*`] = true;
                    settings['files.exclude'][`${c.name}/webpack*`] = true;
                    settings['files.exclude'][`${c.name}/index*`] = true;
                    settings['files.exclude'][`${c.name}/run.js`] = true;
                    settings['files.exclude'][`${c.name}/.vscode`] = true;
                    settings['files.exclude'][`${c.name}/README.md`] = true;
                    settings['files.exclude'][`${c.name}/karma.conf.js*`] = true;
                    settings['files.exclude'][`${c.name}/protractor.conf.js*`] = true;
                    c.filesTemplates().forEach(t => {
                      settings['files.exclude'][`${c.name}/${t}`] = true;
                      settings['files.exclude'][`${c.name}/${t.replace('.filetemplate', '')}`] = true;
                    });
                  })
                }
              }
              return settings
            });
          }
        }
      }
    }



  }

  customFolder() {
    if (this.project.isBasedOnOtherProject) {
      const customFolder = path.join(this.project.location, config.folder.custom)
      const srcFolder = path.join(this.project.location, config.folder.src)
      if (!fse.existsSync(customFolder)) {
        Helpers.mkdirp(customFolder);
        Helpers.mkdirp(srcFolder);
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

# System Files
.DS_Store
Thumbs.db
`+ ignoredByGit + `
${this.project.isTnp ? '!tsconfig*' : ''}
${this.project.isTnp ? 'webpack.*' : ''}
${ this.project.isContainer ? `
# container git projects
${this.project.packageJson.linkedProjects.map(c => `/${c}`).join('\n')}
` : []}
# =====================
${this.project.isCoreProject ? '!*.filetemplate' : '*.filetemplate'}
${this.project.isDocker ? '!Dockerfile.filetemplate' : ''}
${ coreFiles}

`.trimRight() + '\n');


  }



  handleProjectSpecyficFiles() {

    const linkedFolder = this.project.linkedFolders;
    linkedFolder.forEach((c) => {
      const from = path.resolve(path.join(this.project.location, c.from));
      const to = path.resolve(path.join(this.project.location, c.to));
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

    const defaultProjectProptotype = Project.by<Project>(this.project._type, this.project._frameworkVersion) as Project;
    const files: Models.other.RecreateFile[] = [];

    if (this.project.location !== defaultProjectProptotype.location) {
      const projectSpecyficFiles = this.project.projectSpecyficFiles();
      projectSpecyficFiles.forEach(f => {
        let from = path.join(defaultProjectProptotype.location, f);
        if (!Helpers.exists(from) && defaultProjectProptotype.frameworkVersionAtLeast('v2')) {
          const core = Project.by<Project>(
            defaultProjectProptotype._type,
            defaultProjectProptotype.frameworkVersionMinusOne
          );
          from = path.join(core.location, f);
        }
        files.push({
          from,
          where: path.join(this.project.location, f)
        });
      });
      files.forEach(file => {
        Helpers.copyFile(file.from, file.where)
      });
    }

  }

  commonFiles() {
    const wokrspace = Project.by<Project>('workspace');

    const files = this.commonFilesForAllProjects;
    files.map(file => {
      return {
        from: path.join(wokrspace.location, file),
        where: path.join(this.project.location, file)
      }
    }).forEach(file => {
      Helpers.copyFile(file.from, file.where)
    })
  }

  private quickFixForFileNotInRightFolder() {
    const folderAA = path.join(
      this.project.location,
      config.folder.components,
      config.folder.assets,
    );
    const folderForProject = path.join(
      folderAA,
      this.project.name,
    );
    const notInRightPlace = glob.sync(`${folderAA}/**/*.*`);
    console.log('notInRightPlace', notInRightPlace)
    if (notInRightPlace.length > 0) {
      notInRightPlace
        .map(f => {
          return f.replace(folderAA, '')
        })
        .forEach(rp => {
          const sour = path.join(folderAA, rp);
          const dest = path.join(folderForProject, rp);
          console.log('SOUR', sour)
          console.log('DEST', dest)
          if (!fse.lstatSync(sour).isDirectory()) {
            Helpers.copyFile(sour, dest);
          }
        })

    }
  }

  get assetsRelativePathes() {
    const assetsFolders = [];
    if (this.project.typeIsNot('angular-lib')) {
      return [];
    }
    const assetsRelativeAngularLib = path.join(
      config.folder.components,
      config.folder.assets,
      this.project.name
    );

    const pathTOCheck = path.join(this.project.location, assetsRelativeAngularLib)
    if (!Helpers.exists(pathTOCheck)) {
      Helpers.mkdirp(pathTOCheck);
      Helpers.writeFile(path.join(pathTOCheck, 'put-your-assets-here.txt'), `
    This file is generated..
    Please put asset files related for this project here..
      ` );
      // this.quickFixForFileNotInRightFolder();
    }
    assetsFolders.push(assetsRelativeAngularLib);
    return assetsFolders;
  }

  get assetsToIgnore() {
    if (!this.project.isWorkspaceChildProject) {
      return [];
    }
    return this.project.parent.children
      .filter(f => {
        return f.typeIs('angular-lib');
      })
      .map(a => a.recreate.assetsRelativePathes)
      .reduce((a, b) => {
        return a.concat(b);
      }, [])
      .map(asset => {
        return path.join(config.folder.src, asset.replace(new RegExp(`^${config.folder.components}\/`), ''));
      })
  }

  /**
   * QUICK_FIX needs to be before gitignore recreatino ! change it
   */
  initAssets() {
    if (!this.project.isWorkspaceChildProject) {
      return;
    }

    this.project.parent.children
      .filter(f => {
        return f.typeIs('angular-lib');
      })
      .forEach(p => {
        p.recreate.assetsRelativePathes
          .map(rp => path.join(p.location, rp))
          .filter(ap => fse.existsSync(ap))
          .forEach(ap => {
            const dest = path.join(
              this.project.location,
              config.folder.src,
              config.folder.assets,
              p.name,
            );
            // Helpers.info(`COPY ASSET FROM ${ap} to ${dest}`)
            Helpers.copy(ap, dest);
          })
      });

    // this.assetsToIgnore.forEach(rp => {

    // })
  }


}



//#endregion
