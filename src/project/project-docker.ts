import { Project } from "./base-project";
import { BuildOptions } from "../models";

export class ProjectDocker extends Project {


    startOnCommand(port: number) {
        if (!port) port = this.defaultPort;
        this.currentPort = port;
        return 'echo "no docker support jet"'
    }

    projectSpecyficFiles(): string[] {
        return [

        ];
    }

    buildSteps(buildOptions?: BuildOptions) {
        const { prod, watch, outDir } = buildOptions;

    }
}

