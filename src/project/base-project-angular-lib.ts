export abstract class BaseAngularLibProject extends BaseAngularProject {

    projectSpecyficFiles() {
        return super.projectSpecyficFiles().concat([
            'index.js',
            'index.d.ts',
            'index.js.map',
            'gulpfile.js',
            'ng-package.json',
            'tsconfig-aot.bundle.json',
            'tsconfig-aot.dist.json'
        ]);
    }

    buildLib(outDir: BuildDir) {
        compilationWrapper(() => {
            this.run(`tnp rimraf ${outDir}`).sync()
            this.run(`tnp npm-run gulp inline-templates-${outDir}`, { output: false }).sync()
            this.run(`tnp npm-run ngc -p tsconfig-aot.${outDir}.json`).sync()
            if (outDir === 'dist') {
                this.run(`tnp rimraf ${config.folder.module} && tnp ln ${outDir} ${config.folder.module}`).sync()
            }
        }, `angular-lib (project ${this.name})`)
        return this;
    }

    buildSteps(buildOptions?: BuildOptions) {
        const { prod, watch, outDir, appBuild } = buildOptions;
        if (appBuild) {
            super.buildSteps(buildOptions);
        } else {
            if (watch) {
                const p = (prod ? ':prod' : '');
                this.watcher.run(`tnp build:${outDir}${p}`, 'components/src');
            } else {
                this.buildLib(outDir)
            }
        }
    }

}

