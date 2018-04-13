
import { Project } from "../project";
import { run } from '../process';


export function init() {
    Project.Current.recreate.commonFiles();
    Project.Current.recreate.projectSpecyficFiles();
    Project.Current.recreate.gitignore();
    Project.Current.recreate.npmignore();
    Project.Current.recreate.customFolder();
}

export default {
    $INIT: (args) => {
        init()
        process.exit(0)
    },
    $INIT_EVERYWHERE: (args) => {
        Project.projects.forEach(p => {
            run(`tnp init`, { cwd: p.location }).sync()
        })
    }
}