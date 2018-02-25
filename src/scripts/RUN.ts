import { Project } from '../project';

export function run(args: string) {


    const project: Project = Project.Current;

    project.start()
    if(project.type !== 'workspace') {
        process.exit(0)
    }    
}


export default {

    $RUN: (args: string) => run(args)

}