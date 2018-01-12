
import {
    projects
} from '../helpers';

import config from "../config";
import { LibType } from '../models';
import { clear } from "./CLEAR";

function version() {
    console.log(projects.tnp().version);
}


export default {
    VERSION: version
}
