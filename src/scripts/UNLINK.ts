//#region @backend
import * as os from "os";
import { run } from "../helpers";
import { Project } from "../project";
import { error } from "../helpers";
import * as _ from "lodash";
import { LibType } from "../models";
import { onlyLibsChildrens } from "./LINK";

export function unlink(project: Project) {

    let workspaceProject: Project;
    if (project.type === 'workspace') {
        workspaceProject = project;
    } else if (project.parent && project.parent.type === 'workspace') {
        workspaceProject = project.parent;
    } else {
        error(`This project is not workspace type project`)
    }

    if (_.isArray(workspaceProject.children)) {
        onlyLibsChildrens(workspaceProject).forEach(c => c.node_modules.remove())
    }
    workspaceProject.node_modules.localChildrensWithRequiredLibs.removeSymlinks();
    // Project.Tnp.ownNpmPackage.unlinkFrom(workspaceProject);
}

export default {
    $UNLINK: (args) => {
        unlink(Project.Current)
        process.exit(0)
    }
}
//#endregion
