
import { Project } from "../project";
import { run } from '../process';

export default {
    $INIT: (args) => {
        Project.Current.recreate.commonFiles();
        Project.Current.recreate.projectSpecyficFiles();
        Project.Current.recreate.gitignore()
        Project.Current.recreate.customFolder();
        process.exit(0)
    },
    $INIT_EVERYWHERE: (args) => {
        Project.projects.forEach(p => {
            run(`tnp init`, { cwd: p.location }).sync()
        })
    }
}