
// import * as getPort from 'get-port';
// const getPort = require('get-port');


import config from '../config'
import { Project } from '../project';
import { clear } from "./CLEAR";
import { error } from "../messages";


function $LINK() {
    const project = Project.Current;
    project.linkParentDependencies();
}


export default {
    $LINK
}
