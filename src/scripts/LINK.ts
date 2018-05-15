import * as os from "os";
import { run } from "../process";
import { Project } from "../project";
import { error } from "../messages";
import * as _ from "lodash";
import { LibType } from "../models";
import chalk from "chalk";

export function onlyLibsChildrens(workspaceProject: Project) {
    // console.log(workspaceProject.children.map )
    const chidrenTypeToNotLinkNodeModules: LibType[] = [
        'workspace',
        'docker'
    ]
    const children = workspaceProject.children
        .filter(c => !chidrenTypeToNotLinkNodeModules.includes(c.type))
    // console.log(children.map(c => c.location))
    return children;
}

export function link(project: Project) {

    let workspaceProject: Project;
    if (project.type === 'workspace') {
        workspaceProject = project;
    } else if (project.parent && project.parent.type === 'workspace') {
        workspaceProject = project.parent;
    } else {
        error(`This project is not workspace type project`)
    }

    if (!workspaceProject.node_modules.exist()) {
        workspaceProject.node_modules.installPackages();
    }
    if (_.isArray(workspaceProject.children)) {
        onlyLibsChildrens(workspaceProject).forEach(c => {
            // console.log(`Link node_modules to: ${c.name}`)
            workspaceProject.node_modules.linkToProject(c, true)
        })
    }
    workspaceProject.node_modules.localChildrensWithRequiredLibs.removeSymlinks();
    workspaceProject.node_modules.localChildrensWithRequiredLibs.addSymlinks();
    // Project.Tnp.ownNpmPackage.linkTo(workspaceProject);
}




export default {
    $LINK: [(args) => {
        link(Project.Current)
        process.exit(0)
    }, `
ln ${chalk.bold('source')} ${chalk.bold('target')}

    `]

}
