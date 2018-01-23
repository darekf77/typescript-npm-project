import * as _ from 'lodash';
import * as path from 'path';
import chalk from 'chalk';
import fs from 'fs';
import * as os from "os";

import { clear } from "./scripts/CLEAR";

import { LibType, RecreateFile, BuildOptions } from './models';
import { error } from "./messages";
import { Project } from "./project";

const config = {
    folder: {
        watchDist: 'dist/',
        bundle: 'bundle/'
    },

    webpack: {
        paramsFor(libType: LibType, prod = false, watch = false) {
            const o = {
                env: [
                    '--env.production=' + prod,
                    '--env.watch=' + watch
                ],
                config: '--config=' + path.join(__dirname, '/webpack-config/angular-lib.' + (prod ? 'prod.' : '') + 'js'),
                watch: watch ? '--watch' : '',

            }
            return `${o.config} ${o.watch}  --bail ${o.env.join(' ')}`;
        },
        params(prod = false, watch = false) {
            const o = {
                env: [
                    '--env.prod=' + prod,
                    '--env.watch=' + watch
                ],
                config: '--config=' + path.normalize(path.join(__dirname, '/webpack-config/isomorphic-lib.' + (prod ? 'prod.' : '') + 'js'))
            }
            if (os.platform() === 'win32') {
                o.config = o.config.replace(/\\/g, '\\\\')
            }
            return `${o.config} --bail ${o.env.join(' ')}`;
        }
    }

}


export default config;
