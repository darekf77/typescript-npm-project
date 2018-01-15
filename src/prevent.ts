

import { install, run, projects } from "./helpers";
import { info } from "./messages";
import { LibType } from "./models";


export const prevent = {
    notInstalled: {
        nodeModules() {
            const project = projects.current()
            project.preparePackages();
        },
        dependencies: {
            global() {
                // const dependencies = projects.tnp().packageJSON.tnp.dependencies;
                // installDependencies(dependencies.global);
            },
            forAllLibs() {
                // const dependencies = projects.tnp().packageJSON.tnp.dependencies;
                // installDependencies(dependencies.forAllLibs);
            },
            forBuild(porjectType: LibType) {
                // const dependencies = projects.tnp().packageJSON.tnp.dependencies;
                // installDependencies(dependencies.lib[_.kebabCase(porjectType)]);
            }
        }


    }
}