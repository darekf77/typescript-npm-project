import { CLI } from "tnp-cli";
import { config } from "tnp-config";
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
  includeNodeModules?: boolean;
}

export class WebpackBackendCompilation extends FeatureForProject {

  async run(options: WebpackBackendCompilationOpt) {
    const { outDir, watch, uglify, buildType, buildTitle } = options;
    const webpackGlob = this.project.npmPackages.global('webpack');

    const webpackCommand = `node ${webpackGlob} --version && node ${webpackGlob} `
      + `--config webpack.backend-bundle-build.js ${watch ? '--watch' : ''
      } ${uglify ? '--env=useUglify' : ''} --env.outDir=${outDir} `;

    const showInfoWebpack = () => {
      Helpers.info(`

        WEBPACK ${watch ? 'WATCH ' : ''
        } BACKEND BUILD started...

        `);
      Helpers.info(` command: ${webpackCommand}`);
    };

    // TODO QUICK_FIX
    Helpers.writeFile(path.join(this.project.location, outDir, config.file.index_d_ts), EXPORT_TEMPLATE(outDir));

    try {
      showInfoWebpack()
      if (watch) {
        await this.project.execute(webpackCommand, {
          biggerBuffer: true,
          resolvePromiseMsg: {
            stdout: ['hidden modules']
          }
        })
      } else {
        this.project.run(webpackCommand, {
          biggerBuffer: true
        }).sync();
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
