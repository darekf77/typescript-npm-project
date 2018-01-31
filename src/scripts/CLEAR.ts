
import * as _ from 'lodash';
import * as fs from 'fs';
import { run } from "../process";
import config from "../config";
import { LibType } from '../models';
import * as path from 'path';


function clearFiles(files: string[] | string) {
    if (!files) return;
    const toDelete = !Array.isArray(files) ? [files] : files;
    run(`rimraf ${toDelete.join(' ')}`).sync()
    toDelete.forEach(file => {
        console.log(`Deleted ${file}`)
    })
}


export const clear = {
    all: () => {
        clearFiles('node_modules/')
        clearFiles('bundle/')
        clearFiles('dist/')
        clearFiles('tmp/')
        process.exit(0)
    },
    forBuild: (libType?: LibType, exit = true) => {
        clearFiles('bundle/')
        clearFiles('tmp/')
        if (exit) process.exit(0)
    },
    forWatching: (libType?: LibType, exit = true) => {
        clearFiles('dist/*')
        clearFiles('tmp/')
        if (exit) process.exit(0)
    }
};


export default {
    $CLEAN: () => clear.forBuild(),
    $CLEAR: () => clear.forBuild(),
    $CLEAN_ALL: () => clear.all(),
    $CLEAR_ALL: () => clear.all()
}
