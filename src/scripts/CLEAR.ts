
import * as _ from 'lodash';
import { run } from '../helpers';
import config from "../config";
import { projects } from "../helpers";
import { LibType } from '../models';


function clearFiles(files: string[] | string) {
    if (!files) return;
    const toDelete = !Array.isArray(files) ? [files] : files;
    run(`rimraf ${toDelete}`).sync()
    toDelete.forEach(file => {
        console.log(`Deleted ${file}`)
    })
}


export const clear = {
    all: () => {
        clearFiles('node_modules/')
        clear.forBuild();
        clear.forWatching();
    },
    forBuild: (libType?: LibType) => {
        clearFiles('bundle/')
    },
    forWatching: (libType?: LibType) => {
        if (libType === 'isomorphic-lib' || libType === 'nodejs-server') {
            clearFiles('dist/')
            _.forIn(config.templateFiles, (file => clearFiles(file.path)))
        } else if(libType === 'angular-lib') {
            clearFiles('dist/')
        }
    }
};


export default {
    $CLEAN: clear.forBuild,
    $CLEAR: clear.forBuild,
    $CLEAN_ALL: clear.all,
    $CLEAR_ALL: clear.all
}
