import { run } from "../process";
import { Project } from '../project';
import { link } from "./LINK";
import { checkValidNpmPackageName } from "../helpers";
import { error } from "../messages";

function cleanBeforeInstall(workspaceProject: Project) {
    workspaceProject.node_modules.localChildrens.removeSymlinks();
    Project.Tnp.ownNpmPackage.unlinkFrom(workspaceProject);
}

function install(a: string) {
    const args = a.split(' ')


    const project = Project.Current;
    const isWorkspaceParentProject = (project.parent && project.parent.type === 'workspace');
    const parent = project.parent;
    if (args.length === 0) { // NPM INSTALL
        if (isWorkspaceParentProject) { // PROJECT IN WORKSPACE, ADD PACKAGE tnp install
            link(parent)
        } else { // Other normal porojects
            project.node_modules.install()
        }
    } if (args.length >= 1) { // NPM INSTALL <package name>
        const npmPackagesToAdd = args
            .map(p => p.trim())
            .filter(p => {
                const res = checkValidNpmPackageName(p)
                if (!res) {
                    error(`Invalid package to install: ${p}`, true)
                }
                return res;
            })
        if (isWorkspaceParentProject || project.type === 'workspace') {  // workspace project: npm i <package name>
            installInTnpWorkspace(isWorkspaceParentProject ? project.parent : project, npmPackagesToAdd)
        } else {
            npmPackagesToAdd.forEach(npmPackageName => {  // Other normal porojects
                project.node_modules.installPackageFromNPM(npmPackageName)
            })
        }
    }
    process.exit(0);
}

function installInTnpWorkspace(workspace: Project, npmPackagesToAdd: string[]) {
    workspace.node_modules.localChildrens.removeSymlinks();
    Project.Tnp.ownNpmPackage.unlinkFrom(workspace);
    npmPackagesToAdd.forEach(npmPackageName => {
        workspace.node_modules.installPackageFromNPM(npmPackageName)
    })
    workspace.node_modules.localChildrens.addSymlinks();
    Project.Tnp.ownNpmPackage.linkTo(workspace);
}

export default {
    $INSTALL: (args) => install(args),
    $I: (args) => install(args)
}