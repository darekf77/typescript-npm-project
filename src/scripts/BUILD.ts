
import { run } from "../process";
import { Project, BUILD_ISOMORPHIC_LIB_WEBPACK } from '../project';
import { clear } from "./CLEAR";
import { BuildOptions } from "../models";


function build(prod = false, watch = false, project: Project = Project.Current, runAsync = false) {

    const options: BuildOptions = {
        prod, watch, project
    };

    // if (watch) {
    //     clear.forWatching(project.type, false);
    // }
    // else {
    //     clear.forBuild(project.type, false);
    // }

    project.build(options);
    if (!watch) {
        process.exit(0)
    }

}


export default {
    BUILD_ISOMORPHIC_LIB_WEBPACK: (args: string) => {
        BUILD_ISOMORPHIC_LIB_WEBPACK(args)
    },
    $BUILD: () => build(),
    $BUILD_PROD: () => build(true),
    BUILD_WATCH: () => build(false, true),
    BUILD_WATCH_ONCE: () => build(false, true),
    BUILD_WATCH_PROD: () => build(true, true),
}
