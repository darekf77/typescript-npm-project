import config from "../config";
import { LibType } from '../models';
import { clear } from "./CLEAR";
import { Project } from "../project";

function version() {
    console.log(Project.Tnp.version);
    process.exit(0)
}

export default {
    VERSION: ()=> version()
}
