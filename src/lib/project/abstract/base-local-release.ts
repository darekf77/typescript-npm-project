//#region imports
//#region @backend
import * as semver from 'semver';
//#endregion
import {
  BaseFeatureForProject,
  BaseNpmHelpers,
  Helpers,
} from 'tnp-helpers/src';
import { Project } from './project';
import { BaseLinkedProjects } from 'tnp-helpers/src';
import { crossPlatformPath, path } from 'tnp-core/src';
import { config } from 'tnp-config/src';
//#endregion

export class BaseLocalRelease extends BaseFeatureForProject<Project> {
  protected async _() {
    await this.project.init('before local release');
  }

  //#region methods / compilation process
  async compilationProcess() {
    //#region @backendFunc
    //#region resolve pathes
    const destBaseLatest = this.project.pathFor(
      `${config.folder.local_release}/cli/${this.project.nameForCli}-latest`,
    );

    const destBase = destBaseLatest;

    // const destBase = this.project.pathFor(
    //   `${config.folder.local_release}/cli/${this.project.nameForCli}-v${this.project.version}`,
    // );

    const destTmpBaseOldVersions = this.project.pathFor(
      `${config.folder.local_release}/cli/tmp-old-versions/` +
        `${this.project.nameForCli}-v${this.project.version}-${new Date().getTime()}`,
    );
    const destCli = crossPlatformPath([
      destBase,
      config.folder.dist,
      config.file.cli_js,
    ]);
    const destPackageJson = crossPlatformPath([
      destBase,
      config.file.package_json,
    ]);
    const destREADMEmd = crossPlatformPath([destBase, config.file.README_MD]);
    //#endregion

    if (Helpers.exists(destBase)) {
      Helpers.copy(destBase, destTmpBaseOldVersions);
      Helpers.remove(destBase);
    }

    await Helpers.ncc(
      crossPlatformPath([
        this.project.location,
        config.folder.dist,
        config.file.cli_js,
      ]),
      destCli,
      ({ copyToDestination, output }) => {
        // TODO not needed for now
        // const wasmfileSource = crossPlatformPath([
        //   this.project.coreProject.location,
        //   'app/src/assets/sql-wasm.wasm',
        // ]);
        // copyToDestination(wasmfileSource);
        return output;
      },
    );
    this.project.copy(['bin']).to(destBase);

    const destStartJS = crossPlatformPath([destBase, 'bin/start.js']);
    Helpers.writeFile(
      destStartJS,
      `console.log('<<< USING BUNDLED CLI >>>');` +
        `\n${Helpers.readFile(destStartJS)}`,
    );

    Helpers.writeJson(destPackageJson, {
      name: `${this.project.name.replace('-cli', '')}`,
      version: this.project.version,
      bin: this.project.npmHelpers.bin,
    });
    Helpers.writeFile(
      destREADMEmd,
      `# ${this.project.name} CLI\n\n
## Installation as global tool
\`\`\`bash
npm link
\`\`\`
`,
    );
    //#endregion
  }
  //#endregion

  //#region methods / startCLiRelease
  async startCLiRelease() {
    await this._();
    //#region @backendFunc

    await this.project.npmHelpers.bumpPatchVersion();
    this.project.__packageJson.reload();
    await this.compilationProcess();

    //#endregion
  }
  //#endregion
}
