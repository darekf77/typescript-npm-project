import { CLI } from "tnp-cli/src";
import { config } from "tnp-config/src";
import { path } from "tnp-core/src";
import { Helpers } from "tnp-helpers/src";
import { EXPORT_TEMPLATE } from "../../templates";
import { BaseFeatureForProject } from "tnp-helpers/src";
import { BuildOptions } from "../../build-options";
import { Project } from "../abstract/project";

export interface WebpackBackendCompilationOpt {
  watch: boolean;
  buildType: 'app' | 'lib';
  outDir: 'dist';
  cliBuildUglify?: boolean;
  buildTitle?: string;
  cliBuildIncludeNodeModules?: boolean;
}

export class WebpackBackendCompilation extends BaseFeatureForProject<Project> {

  async run(options: Pick<BuildOptions, 'watch' | 'appBuild' | 'outDir'>) {
    const { outDir, watch, appBuild } = options;
    const webpackGlob = this.project.__npmPackages.global('webpack');

    const webpackCommand = `node ${webpackGlob} --version && node ${webpackGlob} `
      + `--config webpack.backend-dist-build.js ${watch ? '--watch' : ''
      } --env.outDir=${outDir} `;

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

      Webpack build fail...
  outdir: ${CLI.chalk(outDir)}, build type: ${CLI.chalk(appBuild ? 'app' : 'lib')}

`, false, true);
    }
  }

}
