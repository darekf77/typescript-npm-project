
import * as _ from 'lodash';
import { LibType, BuildDir } from '../models';
import { clearFiles } from "../helpers";
import { Project } from '../project';

export function clear() {
    Project.Current.clear()
    process.exit(0)
}


export default {
    $CLEAN: (args) => clear(),
    $CLEAR: (args) => clear()
}
