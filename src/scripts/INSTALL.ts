import { run } from "../process";
import { Project } from '../project';
import { link } from "./LINK";
import { checkValidNpmPackageName } from "../helpers";

function install(args: string) {
    args = args.trim()

    const project = Project.Current;
    const isWorkspaceProject = (project.parent && project.parent.type === 'workspace');
    const parent = project.parent;
    if (args.length === 0) {
        if (isWorkspaceProject) { // PROJECT IN WORKSPACE, ADD PACKAGE tnp install
            link(parent)
        } else { // Other normal porojects
            project.node_modules.install()
        }
    } if (args.length >= 1) {
        const npmPackagesToAdd = args
            .split(' ')
            .map(p => p.trim())
            .filter(p => checkValidNpmPackageName(p))
        if (isWorkspaceProject) { // PROJECT IN WORKSPACE, ADD PACKAGE tnp install <pkg name>
            parent.node_modules.localChildrens.removeSymlinks();
            npmPackagesToAdd.forEach(npmPackageName => {
                parent.node_modules.installPackageFromNPM(npmPackageName)
            })
            parent.node_modules.localChildrens.addSymlinks();
        } else { // WORKSPACE, ADD PACKAGE tnp install <pkg name>
            project.node_modules.localChildrens.removeSymlinks();
            npmPackagesToAdd.forEach(npmPackageName => {
                project.node_modules.installPackageFromNPM(npmPackageName)
            })
            project.node_modules.localChildrens.addSymlinks();
        }
    }
    process.exit(0);
}


export default {
    $INSTALL: (args) => install(args),
    $I: (args) => install(args)
}