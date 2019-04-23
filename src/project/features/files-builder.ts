//#region @backend
import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as JSON5 from 'json5';
import * as glob from 'glob';
import * as rimraf from 'rimraf';
// local
import { Project } from "../base-project";
import { LibType, RecreateFile } from "../../models";
import { copyFile, crossPlatofrmPath, tryRemoveDir } from '../../helpers';
import config from '../../config';
import { BaselineSiteJoin } from './baseline-site-join';
import { error } from '../../messages';

interface VSCodeSettings {
  'files.exclude': { [files: string]: boolean; };
  "workbench.colorTheme": "Default Light+" | "Kimbie Dark",
  "workbench.colorCustomizations": {
    "activityBar.background"?: string;
    "activityBar.foreground"?: string;
    "statusBar.background"?: string;
  }
}


function getVscodeSettingsFrom(project: Project) {
  let settings: VSCodeSettings;
  const pathSettingsVScode = path.join(project.location, '.vscode', 'settings.json')
  try {
    settings = JSON5.parse(fs.readFileSync(pathSettingsVScode, 'utf8'))
  } catch (e) { }
  return settings;
}



export class FilesRecreator {

  constructor(private project: Project) {

  }

  public init(includeVscode = false) {
    if (this.project.type === 'container') {
      return;
    }
    this.assets();
    this.commonFiles();
    this.projectSpecyficFiles();

    this.gitignore();
    this.npmignore();
    this.customFolder();
    if (includeVscode) {
      this.vscode.settings.excludedFiles();
      this.vscode.settings.colorsFromWorkspace()
    }

  }

  private get commonFilesForAllProjects() {
    return [
      // '.npmrc',
      'tslint.json',
      '.editorconfig'
    ]
  }

  get filesIgnoredBy() {
    const self = this;
    return {
      get vscodeSidebarFilesView() {
        return self.filesIgnoredBy.gitignore.concat([
          '.gitignore',
          '.npmignore',
          '.npmrc',
          '.babelrc'
        ]).map(f => f.startsWith('/') ? f.slice(1) : f)
          .filter(f => {
            if (self.project.isSite && f === 'src') {
              return false
            }
            return true;
          })
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
        ]).concat( // for site ignore auto-generate scr
          self.project.isSite ? (
            self.project.customizableFilesAndFolders
              .concat(self.project.customizableFilesAndFolders.map(f => {
                return BaselineSiteJoin.PathHelper.PREFIX(f);
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
          .concat(self.project.isTnp ? ['projects/tmp*', 'bin/db.json', `bin/${config.folder.tnp_db_for_tests_json}` ] : [])
        // console.log(`self.project.isCoreProject for "${self.project.name}" = ${self.project.isCoreProject}`)
        // console.log(`self.project.isSite for ${path.basename(path.dirname(self.project.location))} "${self.project.name}" = ${self.project.isSite}  `)
        // console.log('ignoref iles', gitignoreFiles)
        return gitignoreFiles.map(f => `/${f}`)
      },
      get npmignore() {
        const allowedProject: LibType[] = ['isomorphic-lib', 'angular-lib']
        const canBeUseAsNpmPackage = allowedProject.includes(self.project.type);
        const npmignoreFiles = [
          ".vscode",
          "dist/",
          'src/',
          "/scripts",
          "/docs",
          "/preview",
          '/tests',
          "tsconfig.json",
          "npm-debug.log*"
        ].concat(self.commonFilesForAllProjects)

        return npmignoreFiles;
      }
    }
  }



  private modifyVscode(modifyFN: (settings: VSCodeSettings, project?: Project) => VSCodeSettings) {
    const pathSettingsVScode = path.join(this.project.location, '.vscode', 'settings.json')
    if (fs.existsSync(pathSettingsVScode)) {
      try {
        let settings: VSCodeSettings = JSON5.parse(fs.readFileSync(pathSettingsVScode, 'utf8'))
        settings = modifyFN(settings, this.project);
        fs.writeFileSync(pathSettingsVScode, JSON.stringify(settings, null, 2), 'utf8')
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
              settings['workbench.colorTheme'] = white ? "Default Light+" : "Kimbie Dark";
              return settings;
            });
          },

          colorsFromWorkspace() {
            self.modifyVscode((settings, project) => {

              if (project.isWorkspaceChildProject) {

                if (!settings["workbench.colorCustomizations"]) {
                  settings["workbench.colorCustomizations"] = {};
                }

                // update activity bar color
                const parentSettings = getVscodeSettingsFrom(project.parent);
                const statuBarColor = parentSettings &&
                  parentSettings["workbench.colorCustomizations"] &&
                  parentSettings["workbench.colorCustomizations"]["statusBar.background"];
                settings["workbench.colorCustomizations"]["statusBar.background"] = statuBarColor;
                settings["workbench.colorCustomizations"]["statusBar.debuggingBackground"] = statuBarColor;

                // update background color
                if (project.isSite) {
                  const baselineColor = getVscodeSettingsFrom(project.baseline);
                  const activityBarBcg = baselineColor &&
                    baselineColor["workbench.colorCustomizations"] &&
                    baselineColor["workbench.colorCustomizations"]["activityBar.background"];
                  settings["workbench.colorCustomizations"]["activityBar.background"] = activityBarBcg;

                }

              }

              return settings;
            });
          },

          excludedFiles() {
            self.modifyVscode(settings => {
              settings["files.exclude"] = {};
              self.filesIgnoredBy.vscodeSidebarFilesView.map(f => {
                settings["files.exclude"][f] = true
              })
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
      if (!fs.existsSync(customFolder)) {
        this.project.run(`tnp mkdirp ${config.folder.custom} ${config.folder.src}`).sync()
      }
    }
  }


  npmignore() {
    fs.writeFileSync(path.join(this.project.location, '.npmignore'),
      this.filesIgnoredBy.npmignore.join('\n').concat('\n'), 'utf8');
  }

  gitignore() {
    fs.writeFileSync(path.join(this.project.location, '.gitignore'),
      this.filesIgnoredBy.gitignore.join('\n').concat('\n'), 'utf8');
  }










  projectSpecyficFiles() {
    const defaultProjectProptotype = Project.by(this.project.type);
    let files: RecreateFile[] = [];
    if (this.project.location !== defaultProjectProptotype.location) {
      this.project.projectSpecyficFiles().forEach(f => {
        files.push({
          from: path.join(defaultProjectProptotype.location, f),
          where: path.join(this.project.location, f)
        })
      })
      files.forEach(file => {
        copyFile(file.from, file.where)
      })
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
      copyFile(file.from, file.where)
    })
  }

  private assetsToIgnore = []; // TODO make this better, not dependedn gitgnore on it

  /**
   * TODO needs to be before gitignore recreatino ! change it
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
      if (fs.existsSync(previewAssetsPath)) {
        project.run(`rimraf ${previewAssetsPathProjectRelative}`).sync()
      }
      if (fs.existsSync(libAssetsPath)) {
        filesPathesToIgnore.push(path.join(
          config.folder.src,
          config.folder.assets,
          project.name))
        fse.copySync(libAssetsPath, previewAssetsPath);
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
        if (fs.existsSync(clientAssetsPath)) {
          tryRemoveDir(clientAssetsPath)
        }
        if (fs.existsSync(libAssetsPath)) {
          filesPathesToIgnore.push(path.join(
            config.folder.src,
            config.folder.assets,
            child.name))
          fse.copySync(libAssetsPath, clientAssetsPath);
        }
      })
    }
    //  else {
    //     error(`You are not in ${config.libsTypes.filter(lib => {
    //         lib === 'angular-client' || lib === 'angular-lib'
    //     }).join(' or ')} project type.`)
    // }
    this.assetsToIgnore = filesPathesToIgnore.map(p => crossPlatofrmPath(p))
  }


}



//#endregion
