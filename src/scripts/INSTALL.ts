import { run } from "../process";
import { Project } from '../project';
import { link } from "./LINK";
import { checkValidNpmPackageName } from "../helpers";

function cleanBeforeInstall(workspaceProject: Project) {
    workspaceProject.node_modules.localChildrens.removeSymlinks();
    Project.Tnp.ownNpmPackage.unlinkFrom(workspaceProject);
}

function install(args: string) {
    args = args.trim()

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
            .split(' ')
            .map(p => p.trim())
            .filter(p => checkValidNpmPackageName(p))
        if (isWorkspaceParentProject || project.type === 'workspace') {
            installInTnpWorkspace(isWorkspaceParentProject ? project.parent : project, npmPackagesToAdd)
        } else {
            npmPackagesToAdd.forEach(npmPackageName => {
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