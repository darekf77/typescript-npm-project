import * as fs from 'fs';
import * as path from 'path';
import config from "../config";

import { Project, ProjectWorkspace } from "../project";


function rebuildBaselineBundle() {

    const workspace = Project.Current.type === 'workspace' ? Project.Current : Project.Current.parent;
    console.log(workspace.name)
    console.log(workspace.location)

    const baselines = workspace.dependencies.filter(p => p.isBaseLine);
    baselines.forEach(b => {
        console.log(b.name)
        console.log(b.location)
        // workspace.node_modules.baselineSiteJoinedLinks(b).remove()
        // b.children.forEach(c => {
        //     if (fs.existsSync(path.join(c.location, config.folder.bundle))) {
        //         c.build({ outDir: config.folder.bundle as any, prod: false })
        //     }
        // })
        // workspace.node_modules.baselineSiteJoinedLinks(b).add();
    })


    process.exit(0)
}


export default {
    $BASELINE_REBUILD: (args) => rebuildBaselineBundle()
}