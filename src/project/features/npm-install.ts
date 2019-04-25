//#region @backend
import chalk from 'chalk';

import { Project } from '../base-project';
import { info, checkValidNpmPackageName, error, log } from '../../helpers';
import { link } from '../../scripts/LINK';
import { unlink } from '../../scripts/UNLINK';

export class NpmInstall {

  constructor(public project: Project) {

  }


  fromArgs(packagesNamesSpaceSeparated: string) {

    const args = packagesNamesSpaceSeparated.split(' ').filter(a => !!a);
    if(this.project.isContainer || this.project.)
    this.project.packageJson.show('before npm instalation')
    if (args.length === 0) { // NPM INSTALL
      this.installAll();
    } else if (args.length >= 1) { // NPM INSTALL <package name>
      const npmPackagesToAdd = this.resolvePacakgesFromArgs(args);
      this.installPackage(npmPackagesToAdd);
    }
    if (this.project.isContainer || this.project.isWorkspace) {
      this.project.tnpHelper.install()
    }
    this.project.packageJson.dedupe()

  }


  installAll() {
    if (this.project.isContainer) {
      info(`npm install in ${chalk.bold('container')} project`)
      this.project.node_modules.installPackages(force)
    } else if (this.project.isWorkspace) {
      info(`npm install in ${chalk.bold('workspace')} project`)
      if (unlinkChilds) {
        unlink(this.project)
      }
      project.node_modules.installPackages(force)
      link(this.project)
    } else if (this.project.isWorkspaceChildProject) {
      info(`npm install in ${chalk.bold('workspace child')} project`)
      this.project.parent.npmInstall.installAll()
    } else {
      info(`npm install in ${chalk.bold('stanalone')} project`)
      this.project.node_modules.installPackages(true)
    }

    // if (process.platform === 'darwin') {
    //   if (project.isWorkspace) {
    //     project.run(`increase-memory-limit`).sync();
    //   } else if (project.isWorkspaceChildProject) {
    //     project.parent.run(`increase-memory-limit`).sync();
    //   }
    // }
  }

  private copyFromTemplateWorkspaceIfPossible(packageName: string, destination: Project) {

    const templateWorkspace = Project.Tnp;
    if (templateWorkspace === destination) {
      console.log('worksapce installation...')
      return false;
    }

    if (templateWorkspace.node_modules.contains(packageName)) {
      templateWorkspace.node_modules.copy(packageName).to(destination)
      return true;
    }
    return false;
  }


  installPackage(npmPackagesToAdd: string[]) {

    if (this.project.isWorkspace) {  // workspace project: npm i <package name>
      log('** npm install <package> in workspace')

      if (this.copyPackageFromTemplate(npmPackagesToAdd)) {
        info(`All pacakges copied from workspace template`)
        return;
      }

      if (this.project.isWorkspace) {
        unlink(this.project)
      }
      if (!this.project.node_modules.exist()) {
        this.project.node_modules.installPackages()
      }
      npmPackagesToAdd.forEach(npmPackageName => {
        this.project.node_modules.installPackage(npmPackageName)
      })
      if (this.project.isWorkspace) {
        link(this.project)
      }
    } else if (this.project.isWorkspaceChildProject) {
      log('** npm install <package> in child of workspace')

      if (this.copyPackageFromTemplate(npmPackagesToAdd)) {
        info(`All pacakges copied from workspace template`)
        return;
      }
      unlink(this.project.parent)

      if (!this.project.parent.node_modules.exist()) {
        this.project.parent.node_modules.installPackages()
      }
      npmPackagesToAdd.forEach(npmPackageName => {
        this.project.parent.node_modules.installPackage(npmPackageName)
      })
      link(this.project.parent)
    } else {
      log('** npm install <package> in separated project')
      if (!this.project.node_modules.exist()) {
        this.project.node_modules.installPackages()
      }

      if (this.copyPackageFromTemplate(npmPackagesToAdd)) {
        info(`All pacakges copied from workspace template`)
        return;
      }

      npmPackagesToAdd.forEach(npmPackageName => {  // Other normal porojects
        this.project.node_modules.installPackage(npmPackageName)
      })
    }
  }

  resolvePacakgesFromArgs(args: string[]) {
    return args
      .map(p => p.trim())
      .filter(p => {
        if (['--save', '--save-dev'].includes(p)) {
          return false;
        }
        const res = checkValidNpmPackageName(p)
        if (!res) {
          error(`Invalid package to install: ${p}`, true)
        }
        return res;
      })
  }

  private copyPackageFromTemplate(npmPackagesToAdd: string[]) {
    return (npmPackagesToAdd
      .filter(packageName => !this.copyFromTemplateWorkspaceIfPossible(packageName, this.project))
      .length === 0)
  }


}

//#endregion
