
import {
    run, prevent, copyResourcesToBundle
} from '../helpers';

import config from "../config";
import { LibType } from '../models';
import { clear } from "./CLEAR";


function release(prod = false) {
    return function (args) {
        run(`release-it -c ${config.pathes.releaseItJSON(prod)}`).sync()
    }
}


export default {
    $RELEASE: release(),
    $RELEASE_PROD: release(true),
    COPY_RESOURCES: copyResourcesToBundle
}
