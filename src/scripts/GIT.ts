import * as fs from 'fs';
import * as path from 'path';
import { Project } from "../project";
import config from '../config';
import { paramsFrom } from '../helpers';
import { run } from '../process';


function $GIT_REMOVE_UNTRACKED() {
    const gitginoredfiles = Project.Current.recreate.filesIgnoredBy.gitignore
        .filter(f => !(f === config.folder.node_modules)) // link/unlink takes care of node_modules
    gitginoredfiles.forEach(f => {
        const p = path.join(Project.Current.location, f);
        if (fs.existsSync(p)) {
            try {
                if (fs.statSync(p).isDirectory()) {
                    Project.Current.run(`git rm -rf ${f}`).sync()
                } else {
                    Project.Current.run(`git rm ${f}`).sync()
                }
            } catch (error) {
                console.log(error)
            }

        }
    });
    process.exit(0)
}

export default {
    $GIT_REMOVE_UNTRACKED,
    $GIT_REMOVE_UNTRACKED_EVERYWHERE: () => {
        Project.projects.forEach(p => {
            run(`tnp ${paramsFrom($GIT_REMOVE_UNTRACKED.name)}`, { cwd: p.location }).sync()
        })
        process.exit(0)
    }
}