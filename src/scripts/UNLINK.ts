import * as os from "os";
import { run } from "../process";
import { Project } from "../project";
import { error } from "../messages";
import * as _ from "lodash";
import { LibType } from "../models";
import { onlyLibsChildrens } from "./LINK";

export function unlink(workspaceProject: Project) {
    if (_.isArray(workspaceProject.children)) {
        onlyLibsChildrens(workspaceProject).forEach(c => c.node_modules.remove())
    }
    workspaceProject.node_modules.localChildrensWithRequiredLibs.removeSymlinks();
    // Project.Tnp.ownNpmPackage.unlinkFrom(workspaceProject);
}

export default {
    $UNLINK: (args) => {
        let workspaceProject: Project;
        if (Project.Current.type === 'workspace') {
            workspaceProject = Project.Current;
        } else if (Project.Current.parent && Project.Current.parent.type === 'workspace') {
            workspaceProject = Project.Current.parent;
        } else {
            error(`This project is not workspace type project`)
        }
        unlink(workspaceProject)
        process.exit(0)
    }
}
