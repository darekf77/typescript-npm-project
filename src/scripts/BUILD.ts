
import {
    run, prevent, projects
} from '../helpers';

import config from '../config'
import { LibType } from '../models';
import { clear } from "./CLEAR";

function build(prod = false, watch = false, projectType: LibType = projects.current().type,
    projectDir: string = process.cwd(), runAsync = false) {
    return function (args) {
        prevent.notInstalled.nodeModules();
        prevent.notInstalled.tnpDevDependencies();

        if (watch) clear.forWatching();
        else clear.forWatching();

        let command;
        if (projectType === 'isomorphic-lib') {
            prevent.unexist.clientTsInSrc()
            const webpackParams = config.webpack.params(prod, watch);
            // console.log(webpackParams)
            // process.exit(1)
            command = `npm-run webpack ${webpackParams}`
        } else if (projectType === 'nodejs-server') {
            command = 'npm-run tsc -w';
        } else if (projectType === 'angular-lib') {
            command = 'npm-run ng serve';
        } else if (projectType === 'angular-client') {
            command = 'npm-run webpack-dev-server --port=4200';
        } else if (projectType === 'workspace') {
            projects.inFolder(process.cwd()).forEach(d => {
                build(prod, watch, d.type, d.projectPath, true)(args)
            })
            return;
        }

        //#region sync/async
        if (runAsync) run(command).async.inProject(projectDir)
        else run(command).sync.inProject(projectDir)
        //#endregion
    }
}


export default {
    $BUILD: build(),
    $BUILD_PROD: build(true),
    BUILD_WATCH: build(false, true),
    BUILD_WATCH_PROD: build(true, true),
}
