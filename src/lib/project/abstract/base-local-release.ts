//#region imports
//#region @backend
import * as semver from 'semver';
//#endregion
import { BaseNpmHelpers, Helpers } from 'tnp-helpers/src';
import { Project } from './project';
import { BaseLinkedProjects } from 'tnp-helpers/src';
import { crossPlatformPath, path } from 'tnp-core/src';
import { config } from 'tnp-config/src';
//#endregion

export class BaseLocalRelease extends BaseLinkedProjects<Project> {
  protected async _() {
    await this.project.init('before local release');
  }

  async startCLiRelease() {
    await this._();
    //#region @backendFunc

    //#region resolve pathes
    const destBase = this.project.pathFor(
      `${config.folder.local_release}/cli/${this.project.nameForCli}-v${this.project.version}`,
    );

    const destTmpBase = this.project.pathFor(
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
      Helpers.copy(destBase, destTmpBase);
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

    const destBaseLatest = this.project.pathFor(
      `${config.folder.local_release}/cli/${this.project.nameForCli}-latest`,
    );

    let latestProj = Project.ins.From(destBaseLatest);

    if (
      !latestProj ||
      (latestProj && semver.gte(this.project.version, latestProj.version))
    ) {
      if (latestProj) {
        const destBaseLatestProjVersioned = this.project.pathFor(
          `${config.folder.local_release}/cli/${this.project.nameForCli}-v${latestProj.version}`,
        );
        Helpers.remove(destBaseLatestProjVersioned);
        Helpers.copy(destBaseLatest, destBaseLatestProjVersioned);
      }

      Helpers.remove(destBaseLatest);
      Helpers.copy(destBase, destBaseLatest);
    }

    Project.ins.unload(destBaseLatest);
    latestProj = Project.ins.From(destBaseLatest);
    const baseProj = Project.ins.From(
      this.project.pathFor(
        `${config.folder.local_release}/cli/${this.project.nameForCli}-v${latestProj.version}`,
      ),
    );

    const shouldRemoveVersioned =
      baseProj && latestProj && baseProj?.version === latestProj?.version;

    if (shouldRemoveVersioned) {
      Helpers.remove(destBase);
    }

    //#endregion
  }
}
