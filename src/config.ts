import * as _ from 'lodash';
import * as path from 'path';
import chalk from 'chalk';
import fs from 'fs';
import * as os from "os";

import { clear } from "./scripts/CLEAR";

import { LibType, RecreateFile, BuildOptions, BuildDir } from './models';
import { error } from "./messages";
import { Project } from "./project";

export const config = {
    folder: {
        bundle: 'bundle',
        dist: 'dist',
        src: 'src',
        tempSrc: 'tmp-src'
    },
    webpack: {
        params(prod = false, watch = false, outDir: BuildDir = 'dist') {

            const o = {
                env: [
                    '--env.prod=' + prod,
                    '--env.watch=' + watch,
                    '--env.outDir=' + outDir
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
