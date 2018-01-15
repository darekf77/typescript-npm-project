
// import * as getPort from 'get-port';
const getPort = require('get-port');

import {
    run, watcher, prevent, projects, paramFromFn
} from '../helpers';

import config from '../config'
import { Project } from '../models';
import { clear } from "./CLEAR";
import { error } from "../errors";


function build(prod = false, watch = false, project: Project = projects.current(), runAsync = false) {
    return async function (args) {

        if (watch) {
            clear.forWatching(project.type);
        }
        else {
            clear.forBuild(project.type);
        }

        if (!project.type) error("Bad project type " + project.type)
        let command;
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
            // const port = await Promise.resolve(4201)
            // console.log('port', port);
            command = `npm-run webpack-dev-server --port=${4201}`;
        } else if (project.type === 'workspace') {
            projects.inFolder(process.cwd()).forEach(d => {
                build(prod, watch, d, true)(args)
            })
            return;
        }

        if (runAsync) run(command, { projectDirPath: project.location }).async()
        else run(command, { projectDirPath: project.location }).sync()
        // })
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
