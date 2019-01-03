//#region @backend
import { run } from "../process";
import { Project } from '../project';
import { link } from "./LINK";
import { checkValidNpmPackageName } from "../helpers";
import { error, info } from "../messages";
import { unlink } from "./UNLINK";
import chalk from 'chalk';


export function install(a: string, project = Project.Current, unlinkChilds = true, cleanAndDedupe = true, force = false) {
  const args = a.split(' ').filter(a => !!a);
  project.packageJson.saveForInstall(true)
  if (args.length === 0) { // NPM INSTALL
    if (project.type === 'workspace') {
      info(`npm install in ${chalk.bold('workspace')} project`)
      if (unlinkChilds) {
        unlink(project)
      }
      project.node_modules.installPackages(force)
      link(project)
    } else if (project.isWorkspaceChildProject) {
      info(`npm install in ${chalk.bold('workspace child')} project`)
      const parent = project.parent;
      if (unlinkChilds) {
        unlink(parent)
      }
      parent.node_modules.installPackages(force)
      link(parent)
    } else {
      info(`npm install in ${chalk.bold('stanalone')} project`)
      project.node_modules.installPackages(true)
    }

    if (process.platform === 'darwin') {
      if (project.isWorkspace) {
        project.run(`increase-memory-limit`).sync();
      } else if (project.isWorkspaceChildProject) {
        project.parent.run(`increase-memory-limit`).sync();
      }
    }

  } else if (args.length >= 1) { // NPM INSTALL <package name>

    const npmPackagesToAdd = args
      .map(p => p.trim())
      .filter(p => {
        const res = checkValidNpmPackageName(p)
        if (!res) {
          error(`Invalid package to install: ${p}`, true)
        }
        return res;
      })


    if (project.type === 'workspace') {  // workspace project: npm i <package name>
      console.log('** npm install <package> in workspace')
      if (unlinkChilds) {
        unlink(project)
      }
      if (!project.node_modules.exist()) {
        project.node_modules.installPackages()
      }
      npmPackagesToAdd.forEach(npmPackageName => {
        project.node_modules.installPackage(npmPackageName)
      })
      link(project)
    } else if (project.parent && project.parent.type === 'workspace') {
      console.log('** npm install <package> in child of workspace')
      if (unlinkChilds) {
        unlink(project.parent)
      }
      if (!project.parent.node_modules.exist()) {
        project.parent.node_modules.installPackages()
      }
      npmPackagesToAdd.forEach(npmPackageName => {
        project.parent.node_modules.installPackage(npmPackageName)
      })
      link(project.parent)
    } else {
      console.log('** npm install <package> in separated project')
      if (!project.node_modules.exist()) {
        project.node_modules.installPackages()
      }
      npmPackagesToAdd.forEach(npmPackageName => {  // Other normal porojects
        project.node_modules.installPackage(npmPackageName)
      })
    }
  }
  if (cleanAndDedupe) {
    project.packageJson.saveForInstall(false)
    project.packageJson.dedupe()
  }

}

export default {
  $INSTALL: (args) => {
    install(args, undefined, undefined, undefined, true);
    process.exit(0);
  },
  $I: (args) => {
    install(args);
    process.exit(0);
  }
}
//#endregion
