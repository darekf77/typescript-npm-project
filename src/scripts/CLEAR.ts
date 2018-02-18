
import * as _ from 'lodash';
import { LibType, BuildDir } from '../models';
import { clearFiles } from "../helpers";

export const clear = {
    all: () => {
        clearFiles('node_modules/', true)
        clearFiles('bundle/')
        clearFiles('dist/')
        clearFiles('tmp*')
        process.exit(0)
    },
    forBuild: (options?: { outDir?: BuildDir, exit?: boolean; }) => {
        const { outDir = 'bundle', exit = true } = options;
        clearFiles('tmp*')
        if (outDir) clearFiles(outDir);
        if (exit) process.exit(0)
    }
};


export default {
    $CLEAN_DIST: () => clear.forBuild({ outDir: 'dist' }),
    $CLEAR_DIST: () => clear.forBuild({ outDir: 'dist' }),
    $CLEAN_BUNDLE: () => clear.forBuild({ outDir: 'bundle' }),
    $CLEAR_BUNDLE: () => clear.forBuild({ outDir: 'bundle' }),
    $CLEAN_ALL: () => clear.all(),
    $CLEAR_ALL: () => clear.all()
}
