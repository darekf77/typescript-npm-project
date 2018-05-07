import * as fse from 'fs-extra';
import * as path from 'path';
import * as cpr from 'cpr';
import { Project } from "./base-project";
import { BuildOptions } from "../models";
import { ClassHelper, getWebpackEnv } from "../helpers";
// third part
import { IsomoprhicBuild } from "morphi";
import { BaseProjectLib } from "./base-project-lib";



export class ProjectIsomorphicLib extends BaseProjectLib {


    protected defaultPort: number = 4000;
    runOn(port: number, async = false) {
        if (!port) port = this.defaultPort;
        this.currentPort = port;
        const command = `node dist/run.js -p ${port}`;
        const options = {};
        if (async) {
            this.run(command, options).async()
        } else {
            this.run(command, options).sync()
        }
    }

    projectSpecyficFiles(): string[] {
        return super.projectSpecyficFiles().concat([
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
        if (watch) {
            this.buildLib(outDir, prod, false);
            this.buildLib(outDir, prod, true);
        } else {
            this.buildLib(outDir, prod, false);
        }
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
        if (!watch) {
            this.copyWhenExist('bin', outDir, true)
            this.copyWhenExist('package.json', outDir, true)
            this.copyWhenExist('.npmrc', outDir, true)
            this.copyWhenExist('.gitignore', outDir, true)
        }
        new IsomoprhicBuild({
            watch,
            foldersPathes: {
                dist: outDir as any
            },
            toolsPathes: {
                tsc: 'tnp tsc'
            },
            build: {
                otherIsomorphicLibs: isomorphicNames
            }
        }).init()
    }

}