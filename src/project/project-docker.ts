//#region @backend
import { Project } from "./base-project";
import { BuildOptions } from './features/build-options';


export class ProjectDocker extends Project {


    startOnCommand() {
        return 'echo "no docker support jet"'
    }

    projectSpecyficFiles(): string[] {
        return [

        ];
    }

    async buildSteps(buildOptions?: BuildOptions) {
        const { prod, watch, outDir } = buildOptions;

    }
}

//#endregion
