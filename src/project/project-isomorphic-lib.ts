import * as fse from 'fs-extra';
import * as path from 'path';
import * as cpr from 'cpr';
import { Project } from "./base-project";
import { BuildOptions } from "../models";
import { ClassHelper, getWebpackEnv } from "../helpers";
// third part
import { buildIsomorphicVersion } from "morphi";
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
        if (watch) {

            this.run(`npm-run tsc -d false -w --outDir ${outDir}`).async()
            const functionName = ClassHelper.getMethodName(
                ProjectIsomorphicLib.prototype,
                ProjectIsomorphicLib.prototype.BUILD_ISOMORPHIC_LIB_WEBPACK)

            this.watcher.call(functionName, webpackParams);
        } else {
            this.compilationWrapper(() => {
                try {
                    this.copyWhenExist('bin', outDir, true)
                    this.copyWhenExist('package.json', outDir, true)
                    this.copyWhenExist('.npmrc', outDir, true)
                    this.copyWhenExist('.gitignore', outDir, true)
                    
                    this.run(`npm-run tsc --noEmitOnError true --noEmit true --outDir ${outDir}`).sync()
                    this.run(`npm-run tsc -d false --outDir ${outDir}`).sync()
                } catch (e) {
                    process.exit(0)
                }
            }, ` isomorphic-lib (project ${this.name})`, `Backend compilation`)
            this.BUILD_ISOMORPHIC_LIB_WEBPACK(webpackParams);
        }
    }

    BUILD_ISOMORPHIC_LIB_WEBPACK(params: string) {
        this.compilationWrapper(() => {
            const env = getWebpackEnv(params);
            // console.log('WEBPACK PRAMS', env)
            buildIsomorphicVersion({
                foldersPathes: {
                    dist: env.outDir
                },
                toolsPathes: {
                    tsc: 'npm-run tsc',
                    morphi: 'tnp morphi'
                },
                build: {
                    otherIsomorphicLibs: env.additionalIsomorphicLibs
                }
            });
        }, ` isomorphic-lib (project ${this.name})`, `Browser version compilation pid ${process.pid}, ppid ${process.ppid} `)
    }

}