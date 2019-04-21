//#region @backend
import * as path from 'path';
import * as fs from 'fs';
import * as fse from 'fs-extra';
// local
import { Project } from "./base-project";
import { error, info } from "../messages";
import { HelpersLinks } from '../helpers-links';
import { ProjectFrom } from './index';
import config from '../config';
export class NodeModules {

  constructor(private project: Project) { }

  installByCopyFrom(otherProject: Project) {

  }

  copy(packageName: string,
    // options = { copyDependencies: true, overrideMainModuleIfExist: false, keepDependenciesDeep: false }
  ) {
    const self = this;
    return {
      to(destination: Project) {
        const p = ProjectFrom(path.join(self.project.location, config.folder.node_modules, packageName))
        const nodeModeulesPath = path.join(destination.location, config.folder.node_modules)
        if (!fse.existsSync(nodeModeulesPath)) {
          fse.mkdirpSync(nodeModeulesPath)
        }
        // console.log('hAS ORGANIZAION',p.hasNpmOrganization)
        // console.log('ORGANIZAION',p.npmOrganization)

        const pDestPath = path.join(nodeModeulesPath, p.name)
        p.copytToManager.generateSourceCopyIn(pDestPath, { override: false, filterForBundle: false, showInfo: false })

        p.dependencies.forEach(dep => {
          const depDestPath = path.join(nodeModeulesPath, dep.name)
          dep.copytToManager.generateSourceCopyIn(depDestPath, { override: false, filterForBundle: false, showInfo: false })
          dep.node_modules.copy()
        })

        p.devDependencies.forEach(dep => {
          const depDestPath = path.join(nodeModeulesPath, dep.name)
          dep.copytToManager.generateSourceCopyIn(depDestPath, { override: false, filterForBundle: false, showInfo: false })

        })

      }
    }
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
        if (this.project.isStandaloneProject) {
          Project.Tnp.packageJson.saveForInstall(true)
          Project.Tnp.dependencies.forEach(dep => {
            Project.Tnp.node_modules.copy(dep.name).to(this.project)
          })
          Project.Tnp.devDependencies.forEach(dep => {
            Project.Tnp.node_modules.copy(dep.name).to(this.project)
          })

        } else {
          info(`Installing npm packages in ${this.project.name}... `);
          this.project.run('npm i', { cwd: this.project.location, output: true, biggerBuffer: true }).sync()
        }

      }
      console.log('Flattering packages....')
      if (this.project.isGenerated && this.project.isWorkspace) {
        this.project.run(`npm dedupe`).sync()
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
