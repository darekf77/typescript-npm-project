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
    }
}


export default config;
