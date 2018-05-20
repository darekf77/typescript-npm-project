import * as fse from 'fs-extra';
import * as path from 'path';
import { Project } from "./base-project";
import { BuildOptions } from "../models";
import { ClassHelper, getWebpackEnv } from "../helpers";
// third part
import { IsomoprhicBuild } from "morphi";
import { BaseProjectLib } from "./base-project-lib";



export class ProjectIsomorphicLib extends BaseProjectLib {

    startOnCommand(port: number, async = false) {
        if (!port) port = this.defaultPort;
        this.currentPort = port;
        const command = `node dist/run.js -p ${port}`;
        return command;
    }

    projectSpecyficFiles(): string[] {
        return super.projectSpecyficFiles().concat([
            "src/typings.d.ts",
            "tsconfig.json",
            "tsconfig.browser.json"
        ]);
    }


    private get additionalRequiredIsomorphcLibs() {
        const result: string[] = []

        if (Array.isArray(this.requiredLibs)) { // TODO QUCIK_FIX not fixing this 
            this.requiredLibs.forEach(d => {
                result.push(d.name);
            })
        }


        // console.log(result)
        // process.exit(0)
        return result;
    }

    private getIsomorphcLibNames(parentWorksapce = false) {
        let result = [];
        result = result.concat(this.additionalRequiredIsomorphcLibs);

        // console.log('result', result)
        // process.exit(0)
        return result;
    }

    buildSteps(buildOptions?: BuildOptions) {
        const { prod, watch, outDir } = buildOptions;
        this.buildLib(outDir, prod, watch);
        return;
    }

    private copyWhenExist(source: string, outDir: string, folder = false) {
        const basename = source;
        source = path.join(this.location, source);
        outDir = path.join(this.location, outDir, basename);
        if (fse.existsSync(source)) {
            if (folder) {
                fse.copySync(source, outDir, { overwrite: true, recursive: true })
            } else {
                fse.copyFileSync(source, outDir);
            }
        }
    }

    buildLib(outDir: "dist" | "bundle", prod = false, watch = false) {
        const isParentIsWorksapce = (this.parent && this.parent.type === 'workspace')
        const isomorphicNames = this.getIsomorphcLibNames(isParentIsWorksapce)
        const webpackParams = BuildOptions.stringify(prod, watch, outDir, isomorphicNames);

        this.copyWhenExist('bin', outDir, true) // TODO make this for each library
        this.copyWhenExist('package.json', outDir, true)
        this.copyWhenExist('.npmrc', outDir, true)
        this.copyWhenExist('.npmignore', outDir, true)
        this.copyWhenExist('.gitignore', outDir, true)

        new IsomoprhicBuild({
            watch,
            foldersPathes: {
                dist: outDir as any
            },
            toolsPathes: {
                tsc: 'tsc'
            },
            build: {
                otherIsomorphicLibs: isomorphicNames
            }
        }).init()
        this.copyToProjectsOnFinish();
        if (watch) {
            this.watchOutDir()
        }
    }

}