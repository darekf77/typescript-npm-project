
import * as _ from 'lodash';
import { LibType, BuildDir } from '../models';
import { clearFiles } from "../helpers";
import { Project } from '../project';

export function clear(all = false) {
    Project.Current.clear(all)
    process.exit(0)
}


export default {
    $CLEAN: (args) => clear(),
    $CLEAR: (args) => clear(),
    $CLEAN_ALL: (args) => clear(true),
    $CLEAR_ALL: (args) => clear(true)
}
