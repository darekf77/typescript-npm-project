import * as os from "os";
import { run } from "../process";
import { Project } from "../project";
import { error } from "../messages";
import * as _ from "lodash";
import { LibType } from "../models";
import { onlyLibsChildrens } from "./LINK";

export function unlink(workspaceProject: Project) {
    if (workspaceProject.type !== 'workspace') {
        error(`This project is not workspace type project`)
    }
    if (!workspaceProject.node_modules.exist()) {
        workspaceProject.node_modules.install();
    }
    if (_.isArray(workspaceProject.children)) {
        onlyLibsChildrens(workspaceProject).forEach(c => c.node_modules.remove())
    }
    workspaceProject.node_modules.localChildrens.removeSymlinks();
    Project.Tnp.ownNpmPackage.unlinkFrom(workspaceProject);
}

export default {
    $UNLINK: (args) => {
        unlink(Project.Current)
        process.exit(0)
    }
}
