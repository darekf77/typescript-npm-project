//#region @backend
import { Project } from "./base-project";
import { BuildOptions } from "../models";

export class ProjectContainer extends Project {


    startOnCommand() {
        return 'echo "no container support jet"'
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
