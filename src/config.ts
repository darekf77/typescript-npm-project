import * as _ from 'lodash';
import * as path from 'path';
import chalk from 'chalk';
import fs from 'fs';
import * as os from "os";

import { clear } from "./scripts/CLEAR";

import { LibType, RecreateFile, BuildOptions, BuildDir } from './models';
import { error } from "./messages";
import { Project } from "./project/base-project";

export const config = {
    tnp: 'tnp',
    folder: {
        bundle: 'bundle',
        dist: 'dist',
        src: 'src',
        tempSrc: 'tmp-src',
        previewDistApp: 'dist-app',
        browser: 'browser',
        module: 'module',
        custom: 'custom',
        node_modules: 'node_modules'
    },
    libsTypes: [
        'workspace',
        'docker',
        'server-lib',
        'isomorphic-lib',
        'angular-lib',
        'angular-client',
        'angular-cli'
    ] as LibType[]
}


export default config;
