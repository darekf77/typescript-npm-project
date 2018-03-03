import * as os from "os";
import c from '../config';
import * as path from 'path';
import { run } from "../process";
import { Project } from "../project";
import { error } from "../messages";

function $INCLUDE(argsString: string) {
    if (!Project.Current.node_modules.exist()) {
        Project.Current.node_modules.install()
    }
    const distFolder = path.join(Project.Tnp.location, c.folder.dist);
    const targetNodeModules = path.join(Project.Current.node_modules.pathFolder, c.tnp);
    run(`${c.tnp} ln ${distFolder} ${targetNodeModules}`).sync();
    process.exit(0)
}

export default {
    $INCLUDE
}
