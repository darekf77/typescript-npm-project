
// import * as getPort from 'get-port';
const getPort = require('get-port');

import {
    run, watcher, prevent, projects, paramFromFn
} from '../helpers';

import config from '../config'
import { Project } from '../models';
import { clear } from "./CLEAR";
import { error } from "../errors";


function LINK() {
    const project: Project = projects.current()

    

}


export default {
    LINK
}
