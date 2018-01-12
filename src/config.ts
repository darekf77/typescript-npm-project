import * as _ from 'lodash';
import * as path from 'path';
import chalk from 'chalk';
import { clear } from "./scripts/CLEAR";

import { LibType, TemplateFile } from './models';


const config = {
    folder: {
        watchDist: 'dist/',
        bundle: 'bundle/'
    },

    templateFiles: {
        indexJS: new TemplateFile(path.join(process.cwd(), 'index.js'), `"use strict";
        function __export(m) {
            for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
        }
        Object.defineProperty(exports, "__esModule", { value: true });
        __export(require("./dist"));
        //# sourceMappingURL=index.js.map` ),
        indexJSmap: new TemplateFile(path.join(process.cwd(), 'index.js.map'),
            `{"version":3,"file":"index.js","sourceRoot":"","sources":["index.ts"],"names":[],"mappings":";;;;;AAAA,2BAAsB"}`),
        indexDts: new TemplateFile(path.join(process.cwd(), 'index.d.ts'), `export * from './src'; `),
        clientDts: new TemplateFile(path.join(process.cwd(), 'client.d.ts'), `export * from './index'; `),
        clientJS: new TemplateFile(path.join(process.cwd(), 'client.js'))
    } as { [files: string]: TemplateFile },


    pathes: {
        releaseItJSON(prod = false) {
            const releseFile = prod ? 'release-it-prod.json' : 'release-it.json';
            return path.join(__dirname, '..', releseFile);
        },
        newProjectDestination(projectName: string) {
            if (path.isAbsolute(projectName)) return projectName;
            return path.join(process.cwd(), projectName);
        },
        newProjectPrototypePath(libraryType: LibType) {
            if (libraryType === 'angular-lib') return path.join(__dirname, '../projects/angular-lib');
            if (libraryType === 'isomorphic-lib') return path.join(__dirname, '../projects/isomorphic-lib');
            console.error(chalk.red(`Bad library type: ${libraryType}`))
            process.exit(1);
        }
    },

    webpack: {
        params(prod = false, watch = false) {
            const o = {
                env: [
                    '--env.production=' + prod,
                    '--env.isWatch=' + watch
                ],
                config: '--config=' + path.join(__dirname, '/webpack-config/isomorphic-lib.' + (prod ? 'prod.' : '') + 'js'),
                watch: watch ? '--watch' : '',

            }
            return `${o.config} ${o.watch}  --bail ${o.env.join(' ')}`;
        }
    }


}


export default config;
