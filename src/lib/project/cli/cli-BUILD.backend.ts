//#region @backend
import { _, chalk } from "tnp-core/src";
import { Helpers } from "tnp-helpers/src";
import { CommandLineFeature } from "tnp-helpers/src";
import { Project } from "../abstract/project";
import { BuildOptions } from "../../build-options";
import { TEMP_DOCS } from "../../constants";
import { config } from "tnp-config/src";


class $Build extends CommandLineFeature<BuildOptions, Project> {
  protected async __initialize__() {
    this.params = BuildOptions.from(this.params);
    //#region resolve smart containter
    this._tryResolveChildIfInsideArg();
    if (this.project.__isSmartContainerChild) {
      this.params.smartContainerTargetName = this.project.name;
      this.project = this.project.parent;
    } else if (this.project.__isSmartContainer) {
      if (this.project.__smartContainerBuildTarget) {
        this.params.smartContainerTargetName = this.project.__smartContainerBuildTarget.name;
      } else {
        if (this.project.children.length === 1) {
          this.project.__packageJson.data.tnp.smartContainerBuildTarget = _.first(this.project.children).name;
          this.project.__packageJson.save('updating smart container target');
          this.params.smartContainerTargetName = this.project.__smartContainerBuildTarget.name;
        } else {
          //#region display update messge for container build
          Helpers.logError(`

          Please specify in your configuration proper ${chalk.bold('smartContainerBuildTarget')}:

          file: ${config.file.package_json__tnp_json5}

            ...
              smartContainerBuildTarget: <name of main project>
            ...



                `, false, false);

          Helpers.log(`[singularbuildcontainer] children for build: \n\n${this.project.children.map(c => c.name)}\n\n`);
          //#endregion
        }
      }
    }
    //#endregion
    // console.log(this.params)
  }

  public async _() {
    await this.project.build(BuildOptions.from({
      ...this.params,
      buildType: 'lib',
      finishCallback: () => this._exit(),
    }));
  }

  async watch() {
    await this.project.build(BuildOptions.from({
      ...this.params,
      buildType: 'lib',
      watch: true,
    }));
  }

  async default() {
    await this.project.build(BuildOptions.from({
      ...this.params,
      buildType: 'lib',
      watch: true,
    }));
  }

  async app() {
    await this.project.build(BuildOptions.from({
      ...this.params,
      buildType: 'app',
      finishCallback: () => this._exit()
    }));
  }

  async appWatch() {
    await this.project.build(BuildOptions.from({
      ...this.params,
      buildType: 'app',
      watch: true,
    }));
  }

  async start() {
    await this.project.build(BuildOptions.from({
      ...this.params,
      buildType: 'lib-app',
      watch: true,
    }));
  }

  async mkdocs() {

    let res;
    while (true) {
      Helpers.clearConsole()
      res = await Helpers.consoleGui.select('What you wanna do with docs ?',
        Object.values(this.mkdocsActions) as any);
      if (res.command) {
        break;
      }
    }

    this.project.run(res.command, { output: true }).sync();
    if (_.isFunction(res.action)) {
      await res.action();
    }
    Helpers.info('DONE BUILDING DOCS')
    this._exit();
  }

  private mkdocsActions = {
    //#region @notForNpm
    SELECT_COMMAND: {
      name: '< select command >',
    },
    BUILD_DEPLY_DOCS_FIREDEV: {
      name: 'Build & deply docs for www.firedev.io',
      value: {
        command: `python -m mkdocs build --site-dir ../../firedev-projects/www-firedev-io/docs/documentation`,
        action: async () => {
          const firedevProj = Project.ins.From([this.cwd, '../../firedev-projects/www-firedev-io']);
          if (await Helpers.questionYesNo('Push and commit docs update ?')) {
            firedevProj.git.addAndCommit('update docs');
            await firedevProj.git.pushCurrentBranch()
          }
        }
      },
    },
    BUILD_DOCS_FIREDEV: {
      name: 'Build docs for www.firedev.io',
      value: {
        command: `python -m mkdocs build --site-dir ../../firedev-projects/www-firedev-io/${TEMP_DOCS}`,
        action: void 0,
      },
    },
    //#endregion
    SERVE_DOCS_FIREDEV: {
      name: 'Serve docs for www.firedev.io on 8000',
      value: {
        command: 'python -m mkdocs serve',
        action: void 0,
      },
    },
  };

}


export default {
  $Build: Helpers.CLIWRAP($Build, '$Build'),
}
//#endregion
