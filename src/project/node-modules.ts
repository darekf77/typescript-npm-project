import * as path from 'path';
import * as fs from 'fs';
import * as fse from 'fs-extra';
// local
import { Project } from "./base-project";
import { error, info } from "../messages";
import { HelpersLinks } from '../helpers-links';
export class NodeModules {

  constructor(private project: Project) { }


  prepare() {
    if (this.project.parent && this.project.parent.type === 'workspace') {
      if (!this.project.node_modules.exist()) {
        this.project.parent.node_modules.linkToProject(this.project);
      } else if (!this.project.node_modules.isSymbolicLink()) {
        this.project.run(`tnp rimraf ${this.project.node_modules.folderPath}`).sync();
        this.project.parent.node_modules.linkToProject(this.project);
      }
    } else {
      this.project.node_modules.installPackages();
    }
  }

  linkToProject(target: Project, force = false) {
    if (!this.exist()) {
      this.project.node_modules.installPackages();
    }
    const localNodeModules = path.join(this.project.location, 'node_modules');
    const projectNodeModules = path.join(target.location, 'node_modules');
    if (force && fs.existsSync(projectNodeModules)) {
      this.project.run(`tnp rimraf ${projectNodeModules}`);
    }
    const linkCommand = `tnp ln ${localNodeModules} ${target.location}`;
    this.project.run(linkCommand).sync();
  }
  installPackages() {
    const yarnLock = path.join(this.project.location, 'yarn.lock');
    if (!this.exist()) {
      if (fs.existsSync(yarnLock)) {
        info(`Installing npm packages in ${this.project.name}... from yarn.lock `)
        this.project.run('yarn install', { cwd: this.project.location, output: true, biggerBuffer: true }).sync()
      } else {
        info(`Installing npm packages in ${this.project.name}... `);
        this.project.run('npm i', { cwd: this.project.location, output: true, biggerBuffer: true }).sync()
      }
    }
  }
  installPackage(packagePath) {
    this.project.packageJson.installPackage(packagePath, '--save');
  }
  get localChildrensWithRequiredLibs() {
    const self = this;
    const symlinks: Project[] = self.project.requiredLibs
      .concat(self.project.children)
      .concat(self.project.baseline ? [self.project.baseline] : [])
    // console.log(symlinks.map(c => c.name))
    // process.exit(0)
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
        self.project.tnpHelper.install()
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
    this.project.run('tnp rimraf node_modules').sync()
  }
}
