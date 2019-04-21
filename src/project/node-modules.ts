//#region @backend
import * as path from 'path';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as _ from 'lodash';
// local
import { Project } from "./base-project";
import { error, info, warn, log } from "../messages";
import { HelpersLinks } from '../helpers-links';
import { ProjectFrom } from './index';
import config from '../config';
import { ArrNpmDependencyType } from '../models/ipackage-json';
export class NodeModules {

  constructor(private project: Project) { }

  installByCopyFrom(otherProject: Project) {

  }

  get copyBin() {
    const self = this;
    return {
      to(project: Project) {
        const source = path.join(self.project.location, config.folder.node_modules, '.bin')
        const dest = path.join(project.location, config.folder.node_modules, '.bin')
        if (fse.existsSync(source)) {
          if (!fse.existsSync(dest)) {
            fse.mkdirpSync(dest)
          }
          fse.copySync(source, dest, {
            recursive: true,
            overwrite: true
          })
        }
      }
    }
  }

  copy(packageName: string,
    // options = { copyDependencies: true, overrideMainModuleIfExist: false, keepDependenciesDeep: false }
  ) {
    const self = this;
    return {
      to(destination: Project) {
        let projToCopy = ProjectFrom(path.join(self.project.location, config.folder.node_modules, packageName))
        const nodeModeulesPath = path.join(destination.location, config.folder.node_modules)
        if (!fse.existsSync(nodeModeulesPath)) {
          fse.mkdirpSync(nodeModeulesPath)
        }

        const pDestPath = path.join(nodeModeulesPath, projToCopy.name)
        const addedSuccess = projToCopy.copytToManager.generateSourceCopyIn(pDestPath, { override: false, filterForBundle: false, showInfo: false })
        if (!addedSuccess) {
          return;
        }

        log('please wait....')
        const depsNames = self.addDependenceis(self.project, self.project.location);

        depsNames
          // .filter(dep => dep !== self.project.name)
          .forEach(pkgName => {
            const pDestPathPackage = path.join(nodeModeulesPath, pkgName)
            projToCopy = ProjectFrom(path.join(self.project.location, config.folder.node_modules, pkgName))
            if (projToCopy) {
              projToCopy.copytToManager.generateSourceCopyIn(pDestPathPackage, { override: false, filterForBundle: false, showInfo: false })
            } else {
              warn(`This is not a npm package: '${pkgName}' inside "${self.project.location}"`)
            }

          })

      }
    }
  }

  private addDependenceis(project: Project, context: string, allNamesBefore: string[] = []) {
    let newNames = []
    if (!allNamesBefore.includes(project.name)) {
      newNames.push(project.name)
    }

    ArrNpmDependencyType.forEach(depName => {
      newNames = newNames.concat(project.getDeps(depName, context)
        .filter(d => !allNamesBefore.includes(d.name))
        .map(d => d.name))
    })


    let uniq = {}
    newNames.forEach(name => uniq[name] = name)
    newNames = Object.keys(uniq)


    const projects = newNames
      .map(name => ProjectFrom(path.join(context, config.folder.node_modules, name)))
      .filter(f => !!f)

    // console.log('projects', projects.length)
    allNamesBefore = allNamesBefore.concat(newNames);

    projects.forEach(dep => {
      allNamesBefore = this.addDependenceis(dep, context, allNamesBefore)
    })

    return allNamesBefore;
  }


  linkToProject(target: Project, force = false) {
    if (!this.exist()) {
      this.project.node_modules.installPackages();
    }
    const localNodeModules = path.join(this.project.location, 'node_modules');
    const projectNodeModules = path.join(target.location, 'node_modules');
    if (force && fs.existsSync(projectNodeModules)) {
      this.project.run(`rimraf ${projectNodeModules}`);
    }
    const linkCommand = `tnp ln ${localNodeModules} ${target.location}`;
    this.project.run(linkCommand).sync();
  }
  installPackages(force = false) {
    const yarnLock = path.join(this.project.location, 'yarn.lock');
    if (force || !this.exist()) {
      if (fs.existsSync(yarnLock)) {
        info(`Installing npm packages in ${this.project.name}... from yarn.lock `)
        this.project.run('yarn install', { cwd: this.project.location, output: true, biggerBuffer: true }).sync()
      } else {
        info(`Installing npm packages in ${this.project.name}... from TNP.`);

        if (this.project.isTnp || this.project.type === 'unknow-npm-project') {
          this.project.packageJson.saveForInstall(true);
          info(`Installing npm packages in ${this.project.name}... `);
          this.project.run('npm i', { cwd: this.project.location, output: true, biggerBuffer: true }).sync()

        } else {
          Project.Tnp.packageJson.saveForInstall(true)

          ArrNpmDependencyType.forEach(depName => {
            Project.Tnp.getDeps(depName, Project.Tnp.location).forEach(dep => {
              Project.Tnp.node_modules.copy(dep.name).to(this.project)
            })
          });

          Project.Tnp.node_modules.copyBin.to(this.project);

        }

      }
    } else {
      console.log('node_modules exists')
    }
  }
  installPackage(packagePath) {
    this.project.packageJson.installPackage(packagePath);
  }

  contains(packageName: string) {
    return fs.existsSync(path.join(this.project.location, config.folder.node_modules, packageName))
  }
  get localChildrensWithRequiredLibs() {
    const self = this;
    const symlinks: Project[] = self.project.requiredLibs
      .concat(self.project.children)
      .concat(self.project.baseline ? [self.project.baseline] : [])
    // console.log(symlinks.map(c => c.name))

    symlinks.forEach(c => {
      if (path.basename(c.location) != c.name) {
        error(`Project "${c.location}" has different packaage.json name property than his own folder name "${path.basename(c.location)}"`)
      }
    })
    return {
      removeSymlinks() {
        symlinks.forEach(c => {
          const symPkgPath = path.join(self.project.location, 'node_modules', c.name);
          if (fs.existsSync(symPkgPath)) {
            console.log(`Removing symlinks: ${c.name}`)
            fse.unlinkSync(symPkgPath);
          }
        })
      },
      addSymlinks() {
        symlinks.forEach(c => {
          const destination = path.join(self.project.location, 'node_modules');
          const command = `tnp ln ${c.location} ${destination}`;
          console.log(`Adding symlinks: ${c.name}`)
          self.project.run(command).sync();
        })
      },
    }
  }
  exist(): boolean {
    return fs.existsSync(path.join(this.project.location, 'node_modules', '.bin')); // TODO qucik fix for tnp-helpers
  }
  isSymbolicLink(): boolean {
    return HelpersLinks.isLink(this.folderPath);
  }
  get folderPath() {
    return path.join(this.project.location, 'node_modules');
  }
  remove() {
    // console.log('remove node_modules', this.project.location)
    this.project.run('rimraf node_modules').sync()
  }
}
//#endregion
