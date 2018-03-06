import * as os from "os";
import { run } from "../process";
import { Project } from "../project";
import { error } from "../messages";
import * as _ from "lodash";
import { LibType } from "../models";

export function link(workspaceProject: Project) {
    if (workspaceProject.type !== 'workspace') {
        error(`This project is not workspace type project`)
    }
    if (!workspaceProject.node_modules.exist()) {
        workspaceProject.node_modules.install();
    }
    if (_.isArray(workspaceProject.children)) {
        const chidrenTypeToNotLinkNodeModules: LibType[] = [
            'workspace',
            'docker'
        ]
        workspaceProject.children
            .filter(c => !chidrenTypeToNotLinkNodeModules.includes(c.type))
            .forEach(c => workspaceProject.node_modules.linkToProject(c, true))
    }
    workspaceProject.node_modules.localChildrens.removeSymlinks();
    workspaceProject.node_modules.localChildrens.addSymlinks();
}

export default {
    $LINK: (args) => {
        link(Project.Current)
        process.exit(0)
    }
}
