
import {
    run, prevent, projects
} from '../helpers';

import config from '../config'
import { Project } from '../models';
import { clear } from "./CLEAR";

function build(prod = false, watch = false, project: Project = projects.current(), runAsync = false) {
    return function (args) {

        if (watch) clear.forWatching();
        else clear.forBuild();

        let command;
        if (project.type === 'isomorphic-lib') {
            const webpackParams = config.webpack.params(prod, watch);
            command = `npm-run webpack ${webpackParams}`
        } else if (project.type === 'nodejs-server') {
            command = `npm-run tsc ${watch ? '-w' : ''}`;
        } else if (project.type === 'angular-lib') {
            command = `npm-run ng ${watch ? 'serve' : 'build'}`;
        } else if (project.type === 'angular-client') {
            command = 'npm-run webpack-dev-server --port=4200';
        } else if (project.type === 'workspace') {
            projects.inFolder(process.cwd()).forEach(d => {
                build(prod, watch, d, true)(args)
            })
            return;
        }

        //#region sync/async
        if (runAsync) run(command).async.inProject(project.location)
        else run(command).sync.inProject(project.location)
        //#endregion
    }
}


export default {
    $BUILD: build(),
    $BUILD_PROD: build(true),
    BUILD_WATCH: build(false, true),
    BUILD_WATCH_PROD: build(true, true),
}
