import * as os from "os";
import { run } from "../process";
import { Project } from "../project";
import { error } from "../messages";

function $LINK(argsString: string) {
    const project = Project.Current;
    if (project.type !== 'workspace') {
        error(`This project is not workspace type project`)
    }
    if (!project.node_modules.exist()) {
        project.node_modules.install();
    }
    project.node_modules.addLocalSymlinksFromFileDependecies();
    process.exit(0)
}

export default {
    $LINK
}
