import { Project } from "./base-project";
import { BuildOptions, InstalationType } from "../models";

export class ProjectServerLib extends Project {


    startOnCommand(port: number) {
        if (!port) port = this.defaultPort;
        this.currentPort = port;
        const command = `node dist/run.js -p ${port} -s`;
        return command;
    }

    projectSpecyficFiles(): string[] {
        return [];
    }

    buildSteps(buildOptions?: BuildOptions) {
        const { prod, watch, outDir } = buildOptions;
        this.run(`tnp npm-run tsc ${watch ? '-w' : ''} --outDir ${outDir}`).sync()
    }
}

