
import { Project } from '../project';
import { clear } from "./CLEAR";
import { BuildOptions } from "../models";


function build(prod = false, watch = false, project: Project = Project.Current, runAsync = false) {
    return async function (args) {
        const options: BuildOptions = {
            prod, watch, project, runAsync
        };

        if (watch) {
            clear.forWatching(project.type);
        }
        else {
            clear.forBuild(project.type);
        }

        project.build(options);
    }
}



export default {
    $BUILD: build(),
    $BUILD_PROD: build(true),
    BUILD_WATCH_ANGULAR_LIB: Project.BUILD_WATCH_ANGULAR_LIB,
    BUILD_WATCH: build(false, true),
    BUILD_WATCH_PROD: build(true, true),
}
