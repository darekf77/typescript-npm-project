//#region @backend
import * as path from 'path';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as _ from 'lodash';
import chalk from 'chalk';

import { Project } from '../abstract';
import { ArrNpmDependencyType, InstalationType, Package } from '../../models';
import { HelpersLinks, error, info, warn, log, run, tryRemoveDir } from "../../helpers";
import config from '../../config';
import { FeatureForProject } from '../abstract';

export class NodeModules extends FeatureForProject {

  installFrom(source: Project, triggerMsg: string) {
    source.packageJson.show(`instalation of packages from ${this.project.genericName} ${triggerMsg}`);
    log(`copy instalation of npm packages from ${source.genericName} ${triggerMsg}`)
    global.spinner.start()
    ArrNpmDependencyType.forEach(depName => {
      source.getDepsAsProject(depName).forEach(dep => {
        source.node_modules.copy(dep.name).to(this.project)
      })
    });

    source.node_modules.copyBin.to(this.project);
    global.spinner.start()

    this.project.getDepsAsPackage('tnp_overrided_dependencies')
      .forEach(d => {
        this.project.npmPackages.install(triggerMsg, d)
      });

  }

  private get copyBin() {
    const self = this;
    return {
      to(project: Project, linkOnly = false) {
        const source = path.join(self.project.location, config.folder.node_modules, '.bin')
        const dest = path.join(project.location, config.folder.node_modules, '.bin')
        if (fse.existsSync(source)) {
          if (!fse.existsSync(dest)) {
            fse.mkdirpSync(dest)
          }
          if (linkOnly) {
            if (fse.existsSync(dest)) {
              tryRemoveDir(dest)
            }
            fse.symlinkSync(source, dest)
          } else {
            fse.copySync(source, dest, {
              recursive: true,
              overwrite: true
            })
          }

        }
      }
    }
  }

  get exist(): boolean {
    return fs.existsSync(path.join(this.project.location, config.folder.node_modules, '.bin')); // TODO qucik fix for tnp-helpers
  }

  remove() {
    fse.removeSync(path.join(this.project.location, config.folder.node_modules))
  }


  copy(pkg: string | Package, options?: { override?: boolean; linkOnly?: boolean; }) {
    const self = this;
    return {
      to(destination: Project, ) {

        const { override = false, linkOnly = false } = options || {};

        const packageName = (_.isObject(pkg) ? (pkg as Package).name : pkg) as string;
        let projToCopy = Project.From(path.join(self.project.location, config.folder.node_modules, packageName))
        const nodeModeulesPath = path.join(destination.location, config.folder.node_modules)
        if (!fse.existsSync(nodeModeulesPath)) {
          fse.mkdirpSync(nodeModeulesPath)
        }

        const pDestPath = path.join(nodeModeulesPath, projToCopy.name)

        if (linkOnly) {
          projToCopy.linkTo(pDestPath);
        } else {
          const addedSuccess = projToCopy.copyManager.generateSourceCopyIn(pDestPath,
            { override, filterForBundle: false, showInfo: false })
          if (!addedSuccess) {
            return;
          }
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
              if (linkOnly) {
                projToCopy.linkTo(pDestPathPackage);
              } else {
                projToCopy.copyManager.generateSourceCopyIn(pDestPathPackage,
                  { override, filterForBundle: false, showInfo: false })
              }

            } else {
              warn(`This is not a npm package: '${pkgName}' inside "${self.project.location}"`)
            }

          })

      }
    }
  }

  contains(pkg: string | Package) {
    const packageName = (_.isObject(pkg) ? (pkg as Package).name : pkg) as string;
    return fs.existsSync(path.join(this.project.location, config.folder.node_modules, packageName))
  }

  linkToProject(target: Project) {
    const localNodeModules = path.join(this.project.location, config.folder.node_modules);
    const projectNodeModules = path.join(target.location, config.folder.node_modules);
    if (fse.existsSync(projectNodeModules)) {
      this.project.node_modules.remove()
    }
    fse.symlinkSync(localNodeModules, projectNodeModules);
  }

  private addDependenceis(project: Project, context: string, allNamesBefore: string[] = []) {
    let newNames = []
    if (!allNamesBefore.includes(project.name)) {
      newNames.push(project.name)
    }

    ArrNpmDependencyType.forEach(depName => {
      newNames = newNames.concat(project.getDepsAsProject(depName, context)
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

}
//#endregion
