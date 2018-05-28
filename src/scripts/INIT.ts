
import { Project } from "../project";
import { run } from '../process';


export function init(project = Project.Current) {
    if (project.isSite) {
        project.run(`tnp baseline:site:start`).sync()
    }
    project.recreate.assets();
    project.recreate.commonFiles();
    project.recreate.projectSpecyficFiles();
    project.recreate.gitignore();
    project.recreate.npmignore();
    project.recreate.customFolder();
}

export default {
    $INIT: (args) => {
        init()        
        process.exit(0)
    },
    $INIT_VSCODE: () => {
        Project.Current.recreate.vscode.settings.excludedFiles();
        process.exit(0)
    },
    $INIT_EVERYWHERE: (args) => {
        Project.projects.forEach(p => {
            p.run(`tnp init`).sync()
        })
    }
}