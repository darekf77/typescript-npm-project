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
        bower: 'bower',
        vendor: 'vendor',
        dist: 'dist',
        src: 'src',
        tempSrc: 'tmp-src',
        previewDistApp: 'dist-app',
        browser: 'browser',
        module: 'module',
        custom: 'custom',
        components: 'components',
        node_modules: 'node_modules',
        assets: 'assets',
        entities: 'entities',
        controllers: 'controllers',
        
    },
    file: {
      package_json: 'package.json',
      tnpBundle: 'tnp-bundle'
    },
    allowedTypes: {
        app: [
            'angular-cli',
            'angular-client',
            'angular-lib',
            'ionic-client',
            'docker',
            'workspace'
        ] as LibType[],
        libs: [
            'angular-lib',
            'isomorphic-lib',
            'server-lib'
        ] as LibType[]
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
