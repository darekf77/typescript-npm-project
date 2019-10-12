//#region @backend
import * as fse from 'fs-extra';
import * as path from 'path';
import * as JSON5 from 'json5';
// local
import { Project } from '../../abstract';
import { Models } from '../../../models';
import { Helpers } from '../../../helpers';
import { config } from '../../../config';
import { BaselineSiteJoin, HelpersMerge } from '../../compilers/baseline-site-join';
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
    this.assets();
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
            '.babelrc'
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
                self.filesIgnoredBy.vscodeSidebarFilesView.map(f => {
                  settings['files.exclude'][f] = true
                })
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
      this.filesIgnoredBy.gitignore.join('\n').concat('\n'));
  }



  projectSpecyficFiles() {
    const defaultProjectProptotype = Project.by(this.project.type);
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

  private assetsToIgnore = []; // QUICK_FIX make this better, not dependedn gitgnore on it

  /**
   * QUICK_FIX needs to be before gitignore recreatino ! change it
   */
  assets() {
    const filesPathesToIgnore = []
    const project = this.project;

    if (project.type === 'angular-lib') {
      const libAssetsPath = path.join(
        project.location,
        config.folder.components,
        config.folder.assets,
        project.name
      );
      // console.log('libAssetsPath',libAssetsPath)

      const previewAssetsPathProjectRelative = path.join(
        config.folder.src,
        config.folder.assets,
        project.name
      );
      // console.log('previewAssetsPathProjectRelative',previewAssetsPathProjectRelative)

      const previewAssetsPath = path.join(
        project.location,
        previewAssetsPathProjectRelative
      );
      if (fse.existsSync(libAssetsPath)) {
        filesPathesToIgnore.push(path.join(
          config.folder.src,
          config.folder.assets,
          project.name))

        Helpers.copy(libAssetsPath, previewAssetsPath);
      }
    } else if (project.type === 'angular-client' && project.parent && project.parent.type === 'workspace') {
      const parent = project.parent;
      const childrenWithAssets = parent.children.filter(child => child.type === 'angular-lib');
      childrenWithAssets.forEach(child => {
        const libAssetsPath = path.join(
          child.location,
          config.folder.components,
          config.folder.assets,
          child.name
        );
        const clientAssetsPath = path.join(
          project.location,
          config.folder.src,
          config.folder.assets,
          child.name
        );
        if (fse.existsSync(libAssetsPath)) {
          filesPathesToIgnore.push(path.join(
            config.folder.src,
            config.folder.assets,
            child.name))
          Helpers.copy(libAssetsPath, clientAssetsPath);
        }
      })
    }
    //  else {
    //     error(`You are not in ${config.libsTypes.filter(lib => {
    //         lib === 'angular-client' || lib === 'angular-lib'
    //     }).join(' or ')} project type.`)
    // }
    this.assetsToIgnore = filesPathesToIgnore;
  }


}



//#endregion
