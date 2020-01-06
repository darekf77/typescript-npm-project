//#region @backend
import * as fse from 'fs-extra';
import * as path from 'path';
import * as JSON5 from 'json5';
import * as glob from 'glob';
// local
import { Project } from '../../abstract';
import { Models } from 'tnp-models';
import { Helpers } from 'tnp-helpers';
import { config } from '../../../config';
import { BaselineSiteJoin } from '../../compilers/baseline-site-join';
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
  try {
    settings = JSON5.parse(Helpers.readFile(pathSettingsVScode))
  } catch (e) { }
  return settings;
}



export class FilesRecreator extends FeatureForProject {

  public async init() {
    if (this.project.type === 'container') {
      return;
    }
    this.initAssets();
    this.commonFiles();
    this.projectSpecyficFiles();

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
            'logo.svg'
          ])
          .concat(self.project.isWorkspace ? self.project.children.map(c => c.name) : [])
          .map(f => f.startsWith('/') ? f.slice(1) : f)
        // .filter(f => {
        //   // console.log('f',siteFiles)
        //   if (self.project.isSite && siteFiles.includes(f)) {
        //     return false
        //   }
        //   return true;
        // })
      },
      get gitignore() {
        const gitignoreFiles = [ // for sure ingored
          config.folder.node_modules,
          config.file.tnp_system_path_txt,
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
          .concat((self.project.isSite && self.project.isGeneratingControllerEntities) ? [
            path.join(config.folder.custom, config.folder.src, config.file.entities_ts),
            path.join(config.folder.custom, config.folder.src, config.file.controllers_ts)
          ] : [])
          .concat(self.project.filesTemplates().map(f => f.replace('.filetemplate', '')))
          .concat(self.project.type === 'angular-lib' ? ['src/tsconfig.app.json'] : [])
          .concat( // for site ignore auto-generate scr
            self.project.isSite ? (
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
          )
          .concat(self.project.isWorkspaceChildProject ? self.assetsToIgnore : [])
          .concat(!self.project.isStandaloneProject ? self.project.projectSpecyficIgnoredFiles() : [])
          .concat(self.project.isTnp ? ['projects/tmp*', 'bin/db.json', `bin/${config.folder.tnp_db_for_tests_json}`] : [])
          .concat(self.project.isCoreProject ? [] : self.project.projectLinkedFiles().map(({ relativePath, renameFileTo }) => {
            if (renameFileTo) {
              relativePath = path.join(path.basename(relativePath), renameFileTo);
            }
            return relativePath;
          }))
        // .concat(self.project.linkedProjects.map(p => {
        //   const source = self.project.type === 'angular-lib' ? config.folder.components : config.folder.src;
        //   return `${source}/tmp-${p.name}`;
        // }))
        // console.log(`self.project.isCoreProject for "${self.project.name}" = ${self.project.isCoreProject}`)
        // console.log(`self.project.isSite for ${path.basename(path.dirname(self.project.location))} "${self.project.name}" = ${self.project.isSite}  `)
        // console.log('ignoref iles', gitignoreFiles)
        return gitignoreFiles.map(f => `/${f}`)
      },
      get npmignore() {
        const allowedProject: Models.libs.LibType[] = ['isomorphic-lib', 'angular-lib']
        const canBeUseAsNpmPackage = allowedProject.includes(self.project.type);
        const npmignoreFiles = [
          '.vscode',
          'dist/',
          'src/',
          '/scripts',
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
    if (fse.existsSync(pathSettingsVScode)) {
      try {
        let settings: VSCodeSettings = JSON5.parse(Helpers.readFile(pathSettingsVScode))
        settings = modifyFN(settings, this.project);
        Helpers.writeFile(pathSettingsVScode, settings);
      } catch (e) {
        console.log(e)
      }
    } else {
      try {
        const settingFromCore = path.join(Project.by(this.project.type).location, '.vscode', 'settings.json');
        Helpers.mkdirp(path.dirname(pathSettingsVScode));
        let settings: VSCodeSettings = JSON5.parse(Helpers.readFile(settingFromCore))
        settings = modifyFN(settings, this.project);
        Helpers.writeFile(pathSettingsVScode, settings)
      } catch (e) {
        console.log(e)
      }
    }
  }

  get vscode() {
    const self = this;
    return {
      get settings() {
        return {
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

                }

              }

              return settings;
            });
          },

          excludedFiles(hide: boolean = true) {
            self.modifyVscode(settings => {
              settings['files.exclude'] = {};
              if (hide) {
                if (self.project.isTnp) {
                  self.project.node_modules.fixesForNodeModulesPackages.forEach(p => {
                    settings['files.exclude'][p] = true
                  })
                  settings['files.exclude']["*.js"] = true;
                  settings['files.exclude']["*.sh"] = true;
                  settings['files.exclude']["*.xlsx"] = true;
                  settings['files.exclude']["scripts"] = true;
                  settings['files.exclude']["bin"] = true;
                }

                self.filesIgnoredBy.vscodeSidebarFilesView.map(f => {
                  settings['files.exclude'][f] = true
                })
                if (self.project.isCoreProject) {
                  settings['files.exclude']["**/*.filetemplate"] = true;
                  settings['files.exclude']["**/tsconfig.*"] = true;
                  settings['files.exclude']["tslint.*"] = true;
                  settings['files.exclude']["index.*"] = true;
                  settings['files.exclude']["package-lock.json"] = true;
                  settings['files.exclude']["protractor.conf.js"] = true;
                  settings['files.exclude']["karma.conf.js"] = true;
                  settings['files.exclude'][".editorconfig"] = true;
                }
                settings['files.exclude']['bin/db.json'] = false;

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
`+ this.filesIgnoredBy
        .gitignore
        .filter(f => {
          if (this.project.isCoreProject && f.endsWith('.filetemplate')) {
            return false;
          }
          return true;
        })
        .join('\n').concat('\n') + `
${this.project.isTnp ? '!tsconfig*' : ''}
${this.project.isTnp ? 'webpack.*' : ''}
${this.project.isCoreProject ? '!*.filetemplate' : '*.filetemplate'}

`.trimRight() + '\n');



  }



  projectSpecyficFiles() {
    const defaultProjectProptotype = Project.by(this.project.type, this.project.frameworkVersion);
    let files: Models.other.RecreateFile[] = [];
    if (this.project.location !== defaultProjectProptotype.location) {
      this.project.projectSpecyficFiles().forEach(f => {
        files.push({
          from: path.join(defaultProjectProptotype.location, f),
          where: path.join(this.project.location, f)
        });
      });
      files.forEach(file => {
        Helpers.copyFile(file.from, file.where)
      });
    }
  }

  commonFiles() {
    const wokrspace = Project.by('workspace');
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
    if (this.project.type !== 'angular-lib') {
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
        return f.type === 'angular-lib';
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
        return f.type === 'angular-lib';
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
