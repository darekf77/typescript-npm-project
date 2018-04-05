export class ProjectIonicClient extends Project {


    protected defaultPort: number = 8100;
    runOn(port: number, async = false) {
        if (!port) port = this.defaultPort;
        this.currentPort = port;
        const command = `tnp npm-run ionic serve --no-open -p ${port} -s`;
        const options = { cwd: path.join(this.location, config.folder.previewDistApp) };
        if (async) {
            this.run(command, options).async()
        } else {
            this.run(command, options).sync()
        }
    }

    projectSpecyficFiles(): string[] {
        return [
            'index.js',
            'index.d.ts',
            'index.js.map',
            'tsconfig.json'
        ];
    }

    buildSteps(buildOptions?: BuildOptions) {
        const { prod, watch, outDir } = buildOptions;
        if (watch) {
            this.run(`tnp npm-run ionic serve --no-open -p ${this.defaultPort}`).async()
        } else {
            this.run(`tnp npm-run ionic-app-scripts build ${prod ? '--prod' : ''}`).sync();
        }
    }
}