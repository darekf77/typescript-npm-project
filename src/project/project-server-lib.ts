import { Project } from "./base-project";
import { BuildOptions, InstalationType } from "../models";
import { BaseProjectLib } from "./base-project-lib";

export class ProjectServerLib extends BaseProjectLib {


    startOnCommand() {
        const command = `node run.js`;
        return command;
    }

    projectSpecyficFiles(): string[] {
        return super.projectSpecyficFiles().concat([
            "tsconfig.json"
        ]);
    }

    buildLib(outDir: "dist" | "bundle", prod = false, watch = false) {
        this.run(`tnp npm-run tsc ${watch ? '-w' : ''} --outDir ${outDir}`).sync()
    }

    buildSteps(buildOptions?: BuildOptions) {
        const { prod, watch, outDir } = buildOptions;
        this.buildLib(outDir, prod, watch);
        return;
    }
}

