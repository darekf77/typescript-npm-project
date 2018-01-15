import { Project } from '../project';

function $LINK() {
    const project = Project.Current;
    project.linkParentDependencies();
}

export default {
    $LINK
}
