import { run } from "../process";
import { Project } from '../project';
import { link } from "./LINK";
import { checkValidNpmPackageName } from "../helpers";
import { error } from "../messages";
import { unlink } from "./UNLINK";

function cleanBeforeInstall(workspaceProject: Project) {
    workspaceProject.node_modules.localChildrensWithRequiredLibs.removeSymlinks();
    // Project.Tnp.ownNpmPackage.unlinkFrom(workspaceProject);
}

function install(a: string) {
    const args = a.split(' ').filter(a => !!a);
    const project = Project.Current;

    if (args.length === 0) { // NPM INSTALL
        if (project.type === 'workspace') {
            console.log('** npm install in workspace')
            unlink(project)
            project.node_modules.installPackages()
            link(project)
        } else if (project.parent && project.parent.type === 'workspace') {
            console.log('** npm install in child of workspace')
            const parent = project.parent;
            unlink(parent)
            parent.node_modules.installPackages()
            link(parent)
        } else {
            console.log('** npm install in separated project')
            project.node_modules.installPackages()
        }
    } if (args.length >= 1) { // NPM INSTALL <package name>
        //#region npm packages
        const npmPackagesToAdd = args
            .map(p => p.trim())
            .filter(p => {
                const res = checkValidNpmPackageName(p)
                if (!res) {
                    error(`Invalid package to install: ${p}`, true)
                }
                return res;
            })
        //#endregion

        if (project.type === 'workspace') {  // workspace project: npm i <package name>
            console.log('** npm install <package> in workspace')
            unlink(project)
            if (!project.node_modules.exist()) {
                project.node_modules.installPackages()
            }
            npmPackagesToAdd.forEach(npmPackageName => {
                project.node_modules.installPackage(npmPackageName)
            })
            link(project)
        } else if (project.parent && project.parent.type === 'workspace') {
            console.log('** npm install <package> in child of workspace')
            unlink(project.parent)
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
    process.exit(0);
}

export default {
    $INSTALL: (args) => install(args),
    $I: (args) => install(args)
}