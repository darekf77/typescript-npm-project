//#region @backend
import * as path from 'path';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as _ from 'lodash';
import chalk from 'chalk';
import * as TerminalProgressBar from 'progress';

import { Project } from '../abstract';
import { ArrNpmDependencyType, InstalationType, Package } from '../../models';
import { HelpersLinks, error, info, warn, log, run, tryRemoveDir } from "../../helpers";
import config from '../../config';
import { FeatureForProject } from '../abstract';

export class NodeModules extends FeatureForProject {

  async installFrom(source: Project, triggerMsg: string) {
    source.packageJson.show(`instalation of packages from ${this.project.genericName} ${triggerMsg}`);
    log(`[node_modules] Copy instalation of npm packages from ` +
      `${chalk.bold(source.genericName)} to ${chalk.bold(this.project.genericName)} ${triggerMsg}`)

    // global.spinner.start()

    for (let index = 0; index < ArrNpmDependencyType.length; index++) {
      const depName = ArrNpmDependencyType[index];
      const deppp = source.getDepsAsProject(depName);
      for (let index2 = 0; index2 < deppp.length; index2++) {
        const dep = deppp[index2];
        await source.node_modules.copy(dep.name).to(this.project)
      }

    }

    source.node_modules.copyBin.to(this.project);
    // global.spinner.start()

    // const overridedDeps = this.project.getDepsAsPackage('tnp_overrided_dependencies');
    // for (let indexOverridedDeps = 0; indexOverridedDeps < overridedDeps.length; indexOverridedDeps++) {
    //   const d = overridedDeps[indexOverridedDeps];
    //   await this.project.npmPackages.install(triggerMsg, d);
    // }

    this.project.packageJson.dedupe()
  }

  private get copyBin() {
    const self = this;
    return {
      to(project: Project, linkOnly = false) {
        const source = path.join(self.project.location, config.folder.node_modules, '.bin')
        const dest = path.join(project.location, config.folder.node_modules, '.bin')
        if (fse.existsSync(source)) {
          if (linkOnly) {
            HelpersLinks.createSymLink(source, dest)
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

  get folderPath() {
    return path.join(this.project.location, config.folder.node_modules)
  }

  get exist(): boolean {
    return fs.existsSync(path.join(this.project.location, config.folder.node_modules, '.bin')); // TODO qucik fix for tnp-helpers
  }

  remove() {
    tryRemoveDir(path.join(this.project.location, config.folder.node_modules))
  }


  copy(pkg: string | Package, options?: { override?: boolean; linkOnly?: boolean; }) {
    const self = this;
    return {
      async to(destination: Project, ) {

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

        global.hideInfos = true;
        global.hideWarnings = true;
        global.hideLog = true;
        const depsNames = self.addDependenceis(self.project, self.project.location);
        global.hideInfos = false;
        global.hideWarnings = false;
        global.hideLog = false;
        const prog = new TerminalProgressBar('Please wait: :current / :total', depsNames.length);
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
            prog.tick()
          })
        prog.terminate()

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
    HelpersLinks.createSymLink(localNodeModules, projectNodeModules);
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
