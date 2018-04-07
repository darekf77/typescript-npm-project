import { Project } from "./base-project";
import { BuildOptions, InstalationType } from "../models";

export class ProjectServerLib extends Project {


    protected defaultPort: number = 4050;
    runOn(port: number, async = false) {
        if (!port) port = this.defaultPort;
        this.currentPort = port;
        const command = `node dist/run.js -p ${port} -s`;
        const options = {};
        if (async) {
            this.run(command, options).async()
        } else {
            this.run(command, options).sync()
        }
    }

    projectSpecyficFiles(): string[] {
        return [];
    }

    buildSteps(buildOptions?: BuildOptions) {
        const { prod, watch, outDir } = buildOptions;
        this.run(`tnp npm-run tsc ${watch ? '-w' : ''} --outDir ${outDir}`).sync()
    }
}

