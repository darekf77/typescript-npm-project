import { Project } from "./base-project";
import { BuildOptions } from "../models";

export class ProjectDocker extends Project {


    protected defaultPort: number;
    runOn(port: number, async = false) {
        if (!port) port = this.defaultPort;
        this.currentPort = port;
    }

    projectSpecyficFiles(): string[] {
        return [

        ];
    }

    buildSteps(buildOptions?: BuildOptions) {
        const { prod, watch, outDir } = buildOptions;

    }
}

