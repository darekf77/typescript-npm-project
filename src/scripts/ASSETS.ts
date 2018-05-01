import { Project } from "../project";
import * as fse from 'fs-extra';

function recreate() {

    const project = Project.Current;

    if (project.type === 'angular-lib') {
        

    } else if (project.type === 'angular-client') {

    }

}

export default {
    $RECREATE: () => recreate()
}