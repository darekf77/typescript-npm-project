import { BuildOptions } from "tnp-db";
import { Helpers } from "tnp-helpers";
import { Project } from "../../../abstract";

export interface WebpackBackendCompilationOpt {
  watch: boolean;
  buildType: 'app' | 'lib';
  outDir: 'dist' | 'bundle';
  uglify?: boolean;
  buildTitle: string;
  // @LAST
}

export class WebpackBackendCompilation {

  from(project: Project) {
    const inst = new WebpackBackendCompilation(project);
  }

  private constructor(private project: Project) {

  }


  startFor(options: WebpackBackendCompilationOpt) {
    const webpackGlob = this.project.npmPackages.global('webpack');
    const webpackCommandFn = (watchCommand: boolean) =>
      `node ${webpackGlob} --version && node ${webpackGlob} `
      + `--config webpack.backend-bundle-build.js ${watchCommand ? '--watch -env=useUglify' : ''}`;

    const webpackCommand = webpackCommandFn(options.watch);

    const showInfoWebpack = () => {
      Helpers.info(`

        WEBPACK ${options.watch ? 'WATCH ' : ''
        } BACKEND BUILD started...

        `);
      Helpers.info(` command: ${webpackCommand}`);
    };

    try {
      showInfoWebpack()
      this.project.run(webpackCommand).async();
    } catch (er) {
      Helpers.error(`WATCH BUNDLE build failed`, false, true);
    }
  }

}
