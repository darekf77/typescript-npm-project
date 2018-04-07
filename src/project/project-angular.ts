import * as path from 'path';
import * as fs from 'fs';
// third part
import { Project } from "./base-project";
import { error } from "../messages";
import config from "../config";
import { BuildOptions } from '../models';
export class AngularProject extends Project {

    protected defaultPort: number = 4200;
    get isEjectedProject() {
        try {
            const file = fs.readFileSync(path.join(this.location, '.angular-cli.json')).toString()
            const config: { project: { ejected: boolean; } } = JSON.parse(file);
            return (config.project && config.project.ejected);
        } catch (e) {
            error(e)
        }
    }


    projectSpecyficFiles() {
        return [
            "tsconfig.json",
            'src/tsconfig.app.json',
            'src/tsconfig.spec.json',
            'src/tsconfig.packages.json',
            'protractor.conf.js',
            'karma.conf.js'
        ].concat(this.isEjectedProject ? [
            'webpack.config.build.aot.js',
            'webpack.config.build.js',
            'webpack.config.common.js',
            'webpack.config.js'
        ] : [])
    }

    preventWarningTypescirptMismatch() {
        this.run('tnp npm-run ng set warnings.typescriptMismatch=false').sync()
    }

    runOn(port: number, async = false) {
        if (!port) port = this.defaultPort;
        this.currentPort = port;
        const command = `tnp http-server -p ${port} -s`;
        const options = { cwd: path.join(this.location, config.folder.previewDistApp) };
        if (async) {
            this.run(command, options).async()
        } else {
            this.run(command, options).sync()
        }
    }

    buildApp(watch = false, prod: boolean, port?: number) {
        const outDirApp = 'dist-app';
        if (watch) {
            const p = (port !== undefined ? `--port ${port}` : '');
            if (this.isEjectedProject) {
                this.run(`tnp npm-run webpack-dev-server ${p}`, { biggerBuffer: true }).async()
            } else {
                this.run(`tnp npm-run ng serve ${p}`, { biggerBuffer: true }).async()
            }
        } else {
            if (this.isEjectedProject) {
                const aot = (prod ? 'aot.' : '');
                this.run(`tnp rimraf ${outDirApp} && tnp npm-run webpack --config=webpack.config.build.${aot}js`, { biggerBuffer: true }).sync()
            } else {
                this.run(`npm-run ng build --output-path ${config.folder.previewDistApp}`, { biggerBuffer: true }).sync()
            }
        }

    }

    buildSteps(buildOptions?: BuildOptions) {
        const { prod, watch, outDir, appBuild } = buildOptions;
        if (this.isEjectedProject) {
            this.preventWarningTypescirptMismatch()
        }
        if (appBuild) {
            this.buildApp(watch, prod, this.defaultPort);
        }
    }

}

