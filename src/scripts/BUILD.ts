
// import * as getPort from 'get-port';
// const getPort = require('get-port');

import {
    run, watcher
} from '../process';


import config from '../config'
import { Project } from '../project';
import { clear } from "./CLEAR";
import { error } from "../messages";
import { BuildOptions } from "../models";


function build(prod = false, watch = false, project: Project = Project.Current, runAsync = false) {
    return async function (args) {
        const options: BuildOptions = {
            prod, watch, project, runAsync
        };

        let command;
        if (watch) {
            clear.forWatching(project.type);
        }
        else {
            clear.forBuild(project.type);
        }

        



        if (project.type === 'isomorphic-lib') {
            const webpackParams = config.webpack.params(prod, watch);
            command = `npm-run webpack ${webpackParams}`
        } else if (project.type === 'nodejs-server') {
            command = `npm-run tsc ${watch ? '-w' : ''}`;
        } else if (project.type === 'angular-lib') {
            if (watch) {
                run('npm-run ng server', { biggerBuffer: true, folder: 'preview' }).async()
                watcher.run(BUILD_WATCH_ANGULAR_LIB, 'preview/components/src');
                return;
            } else {
                run(`npm run build:lib`, { folder: 'preview' }).sync();
            }
        } else if (project.type === 'angular-client') {
            command = `npm-run webpack-dev-server --port=${4201}`;
        } else if (project.type === 'workspace') {
            project.children.forEach(child => {
                build(prod, watch, child, true)(args)
            })
            return;
        }

        if (runAsync) run(command, { projectDirPath: project.location }).async()
        else run(command, { projectDirPath: project.location }).sync()
    }
}


function BUILD_WATCH_ANGULAR_LIB() {
    console.log('Rebuilding start...')
    run(`npm run build:esm`, { folder: 'preview' }).sync();
    console.log('Rebuilding done.')
}

export default {
    $BUILD: build(),
    $BUILD_PROD: build(true),
    BUILD_WATCH_ANGULAR_LIB,
    BUILD_WATCH: build(false, true),
    BUILD_WATCH_PROD: build(true, true),
}
