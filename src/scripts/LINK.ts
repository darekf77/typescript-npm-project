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

export function link(workspaceProject: Project) {

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
        let workspaceProject: Project;
        if (Project.Current.type === 'workspace') {
            workspaceProject = Project.Current;
        } else if (Project.Current.parent && Project.Current.parent.type === 'workspace') {
            workspaceProject = Project.Current.parent;
        } else {
            error(`This project is not workspace type project`)
        }
        link(workspaceProject)
        process.exit(0)
    }, `
ln ${chalk.bold('source')} ${chalk.bold('target')}

    `]

}
