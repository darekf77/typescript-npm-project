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
    if (workspaceProject.type !== 'workspace') {
        error(`This project is not workspace type project`)
    }
    if (!workspaceProject.node_modules.exist()) {
        workspaceProject.node_modules.install();
    }
    if (_.isArray(workspaceProject.children)) {
        onlyLibsChildrens(workspaceProject).forEach(c => {
            // console.log('link nodemoulse to ')
            workspaceProject.node_modules.linkToProject(c, true)
        })
    }
    workspaceProject.node_modules.localChildrensWithRequiredLibs.removeSymlinks();
    workspaceProject.node_modules.localChildrensWithRequiredLibs.addSymlinks();
    Project.Tnp.ownNpmPackage.linkTo(workspaceProject);
}


export function linkBaseline(projectWithBaselinesDependencies: Project) {
    const baselines = projectWithBaselinesDependencies.dependencies.filter(b => b.type === 'workspace')
    baselines.forEach(b => {
        console.log(`Linking baseline: ${b.name} from ${b.location}`)
        Project.Current.node_modules.baselineSiteJoinedLinks(b).add()
    })
}

export default {
    $LINK: [(args) => {
        link(Project.Current)
        process.exit(0)
    }, `
ln ${chalk.bold('source')} ${chalk.bold('target')}

    `],
    $LINK_BASELINE: (args) => {
        if (Project.Current.type === 'workspace') {
            linkBaseline(Project.Current)
        } else if (Project.Current.parent && Project.Current.parent.type === 'workspace') {
            linkBaseline(Project.Current.parent)
        } else {
            error(`No baseline projects to link...`)
        }
        process.exit(0)
    }

}
