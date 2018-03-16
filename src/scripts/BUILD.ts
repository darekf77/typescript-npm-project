import { run } from "../process";
import { Project, ProjectIsomorphicLib } from '../project';
import { clear } from "./CLEAR";
import { BuildOptions, BuildDir } from "../models";
import { info } from "../messages";


export function build(prod = false, watch = false, outDir: BuildDir = 'dist') {

    const options: BuildOptions = {
        prod, watch, outDir
    };

    const project: Project = Project.Current;

    project.build(options);
    if (!watch) {
        process.exit(0)
    }

}


export default {
    $BUILD_ISOMORPHIC_LIB_WEBPACK: (args: string) => {
        (Project.Current as ProjectIsomorphicLib).BUILD_ISOMORPHIC_LIB_WEBPACK(args);
        process.exit(0)
    },

    $BUILD_DIST: () => build(),
    $BUILD_DIST_PROD: () => build(true),

    $BUILD_BUNDLE: () => build(false, false, 'bundle'),
    $BUILD_BUNDLE_PROD: () => build(false, false, 'bundle')

}