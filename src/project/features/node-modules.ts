//#region @backend
import * as path from 'path';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as _ from 'lodash';
import chalk from 'chalk';

import { Project } from "../abstract";
import { ArrNpmDependencyType, InstalationType } from '../../models';
import { HelpersLinks, error, info, warn, log, run } from "../../helpers";
import config from '../../config';
import { FeatureForProject } from '../abstract';

export class NodeModules extends FeatureForProject {

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

  get folderPath() {
    return path.join(this.project.location, config.folder.node_modules);
  }

  exist(): boolean {
    return fs.existsSync(path.join(this.project.location, 'node_modules', '.bin')); // TODO qucik fix for tnp-helpers
  }

  remove() {
    fse.removeSync(this.folderPath)
  }

  installPackages() {
    // global.spinner.start()
    const yarnLock = path.join(this.project.location, 'yarn.lock');
    if (!this.exist()) {
      if (fs.existsSync(yarnLock)) {
        info(`Installing npm packages in ${this.project.name}... from yarn.lock `)
        this.project.run('yarn install', { cwd: this.project.location, output: true, biggerBuffer: true }).sync()
      } else {

        if (this.project.isTnp || this.project.type === 'unknow-npm-project') {

          this.project.packageJson.show('for normal npm instalation')
          info(`Installing npm packages in ${this.project.name}... `);
          this.project.run('npm i', { cwd: this.project.location, output: true, biggerBuffer: true }).sync()

        } else {
          if (this.project.isContainerChild) {
            this.installALlPackageFromContainer()
          } else {
            this.installALlPackageFromTnp()
          }
        }

      }
    } else {
      log(`node_modules exists for '${this.project.name}'`)
    }
    // global.spinner.stop()
  }

  installPackage(packageName?: string) {
    if (!_.isString(packageName) || packageName.trim() === '') {
      error(`Invalida package name "${packageName}"`, true, true)
      return
    }
    const type: InstalationType = '--save';

    const yarnLock = path.join(this.project.location, 'yarn.lock');
    if (fs.existsSync(yarnLock)) {
      info(`Installing npm packge: "${packageName}" with yarn.`)
      run(`yarn add ${packageName} ${type}`, { cwd: this.project.location }).sync()
    } else {
      info(`Installing npm packge: "${packageName}" with npm.`)
      run(`npm i ${packageName} ${type}`, { cwd: this.project.location }).sync()
    }
  }

  copy(packageName: string,
    // options = { copyDependencies: true, overrideMainModuleIfExist: false, keepDependenciesDeep: false }
  ) {
    const self = this;
    return {
      to(destination: Project) {
        let projToCopy = Project.From(path.join(self.project.location, config.folder.node_modules, packageName))
        const nodeModeulesPath = path.join(destination.location, config.folder.node_modules)
        if (!fse.existsSync(nodeModeulesPath)) {
          fse.mkdirpSync(nodeModeulesPath)
        }

        const pDestPath = path.join(nodeModeulesPath, projToCopy.name)
        const addedSuccess = projToCopy.copyManager.generateSourceCopyIn(pDestPath,
          { override: false, filterForBundle: false, showInfo: false })
        if (!addedSuccess) {
          return;
        }

        log('please wait....')
        global.hideInfos = true;
        global.hideWarnings = true;
        global.hideLog = true;
        const depsNames = self.addDependenceis(self.project, self.project.location);
        global.hideInfos = false;
        global.hideWarnings = false;
        global.hideLog = false;

        depsNames
          // .filter(dep => dep !== self.project.name)
          .forEach(pkgName => {
            const pDestPathPackage = path.join(nodeModeulesPath, pkgName)
            projToCopy = Project.From(path.join(self.project.location, config.folder.node_modules, pkgName))
            if (projToCopy) {
              projToCopy.copyManager.generateSourceCopyIn(pDestPathPackage, { override: false, filterForBundle: false, showInfo: false })
            } else {
              warn(`This is not a npm package: '${pkgName}' inside "${self.project.location}"`)
            }

          })

      }
    }
  }

  contains(packageName: string) {
    return fs.existsSync(path.join(this.project.location, config.folder.node_modules, packageName))
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
      .map(name => {
        // TODO hide messages
        return Project.From(path.join(context, config.folder.node_modules, name))
      })
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

  private installALlPackageFromTnp() {
    info(`Installing npm packages in ${this.project.name}... from TNP.`);
    this.project.packageJson.show('show before install fron tnp')
    Project.Tnp.packageJson.show('show to copy from')

    ArrNpmDependencyType.forEach(depName => {
      Project.Tnp.getDeps(depName, Project.Tnp.location).forEach(dep => {
        Project.Tnp.node_modules.copy(dep.name).to(this.project)
      })
    });

    Project.Tnp.node_modules.copyBin.to(this.project);
  }

  private installALlPackageFromContainer() {

    const contaier = this.project.parent;
    if (!contaier.node_modules.exist()) {
      info(`npm install in ${chalk.bold('container')} project`)
      contaier.packageJson.show('recreate container packages list for quick tnp install')
      contaier.node_modules.installPackages()
    }

    info(`Installing npm packages in ${this.project.name}... from parent container.`);

    ArrNpmDependencyType.forEach(depName => {
      contaier.getDeps(depName, contaier.location).forEach(dep => {
        // console.log('dep', dep)
        contaier.node_modules.copy(dep.name).to(this.project)
      })
    });

    contaier.node_modules.copyBin.to(this.project);
  }

}
//#endregion
