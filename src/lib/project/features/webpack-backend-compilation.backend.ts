import { CLI } from "tnp-cli";
import { path } from "tnp-core";
import { BuildOptions } from "tnp-db";
import { Helpers } from "tnp-helpers";
import { EXPORT_TEMPLATE } from "../../templates";
import { FeatureForProject } from "../abstract/feature-for-project";

export interface WebpackBackendCompilationOpt {
  watch: boolean;
  buildType: 'app' | 'lib';
  outDir: 'dist' | 'bundle';
  uglify?: boolean;
  buildTitle?: string;
}

export class WebpackBackendCompilation extends FeatureForProject {

  run(options: WebpackBackendCompilationOpt) {
    const { outDir, watch, uglify, buildType, buildTitle } = options;
    const webpackGlob = this.project.npmPackages.global('webpack');



    const webpackCommand = `node ${webpackGlob} --version && node ${webpackGlob} `
      + `--config webpack.backend-${outDir}-build.js ${watch ? '--watch' : ''
      } ${uglify ? '-env=useUglify' : ''}`;

    const showInfoWebpack = () => {
      Helpers.info(`

        WEBPACK ${watch ? 'WATCH ' : ''
        } BACKEND BUILD started...

        `);
      Helpers.info(` command: ${webpackCommand}`);
    };

    // TODO QUICK_FIX
    Helpers.writeFile(path.join(this.project.location, outDir, 'index.d.ts'), EXPORT_TEMPLATE('dist'));

    try {
      showInfoWebpack()
      if (watch) {
        this.project.run(webpackCommand).async();
      } else {
        this.project.run(webpackCommand).sync();
      }
    } catch (er) {
      Helpers.error(`

      Build ${buildTitle ? (buildTitle + ' ') : ' '
        }fail...
  outdir: ${CLI.chalk(outDir)}, build type: ${CLI.chalk(buildType)}

`, false, true);
    }
  }

}
