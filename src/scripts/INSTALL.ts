import { run } from "../process";
import { Project } from '../project';

function install(args: string) {
    args = args.trim()

    const project = Project.Current;
    const isWorkspaceProject = (project.parent && project.parent.type === 'workspace');
    const parent = project.parent;
    if (args.length === 0) {
        if (isWorkspaceProject) { // PROJECT IN WORKSPACE, ADD PACKAGE tnp install
            if (!parent.node_modules.exist()) {
                parent.node_modules.install()
            }
            parent.node_modules.addLocalSymlinksFromFileDependecies();
            parent.node_modules.linkToProject(project, true);
        } else { // Other normal porojects
            project.node_modules.install()
        }
    } if (args.length >= 1) {
        const packagesToAdd = args.split(' ');
        if (isWorkspaceProject) { // PROJECT IN WORKSPACE, ADD PACKAGE tnp install <pkg name>
            parent.node_modules.removeSymlinks();
            packagesToAdd.forEach(pkg => {
                parent.node_modules.installPackageFromLocalPath(pkg)
            })
            parent.node_modules.addLocalSymlinksFromFileDependecies()
        } else { // WORKSPACE, ADD PACKAGE tnp install <pkg name>
            project.node_modules.removeSymlinks();            
            packagesToAdd.forEach(pkg => {
                project.node_modules.installPackageFromLocalPath(pkg)
            })
            project.node_modules.addLocalSymlinksFromFileDependecies()
        }
    }
    process.exit(0);
}


export default {
    $INSTALL: (args) => install(args),
    $I: (args) => install(args)
}