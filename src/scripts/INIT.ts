
import { Project } from "../project";
import { run } from '../process';


export function init() {
    Project.Current.tnpHelper.link()
    Project.Current.recreate.assets();
    Project.Current.recreate.commonFiles();
    Project.Current.recreate.projectSpecyficFiles();
    Project.Current.recreate.gitignore();
    Project.Current.recreate.npmignore();
    Project.Current.recreate.customFolder();
}

export default {
    $INIT: (args) => {
        init()
        if (Project.Current.isSite) {
            Project.Current.run(`tnp baseline:site:start`).sync()
        }
        process.exit(0)
    },
    $INIT_VSCODE: () => {
        Project.Current.recreate.vscode.settings.excludedFiles();
        process.exit(0)
    },
    $INIT_EVERYWHERE: (args) => {
        Project.projects.forEach(p => {
            p.run(`tnp init`).sync()
            if (p.isSite) {
                p.run(`tnp baseline:site:start`).sync()
            }
        })
    }
}