import { CoreModels, _, chalk, path } from 'tnp-core/src';
import { Helpers } from 'tnp-helpers/src';
import { CommandLineFeature } from 'tnp-helpers/src';
import { Project } from '../abstract/project';
import { BuildOptions, ReleaseOptions } from '../../build-options';
import { Models } from '../../models';
import { config } from 'tnp-config/src';

class $Release extends CommandLineFeature<ReleaseOptions, Project> {
  __initialize__() {
    //#region resolve smart containter
    let resolved = [];
    if (this.project.__isContainer) {
      resolved = Helpers.cliTool.resolveItemsFromArgsBegin<Project>(
        this.args,
        a => {
          return Project.ins.From(path.join(this.project.location, a));
        },
      )?.allResolved;

      const otherDeps = this.project.children.filter(c => {
        return !resolved.includes(c);
      });

      resolved = Project.sortGroupOfProject<Project>(
        [...resolved, ...otherDeps],
        proj => proj.__includeOnlyForRelease || [],
        proj => proj.name,
      ).filter(d => d.name !== this.project.name);
    }
    this.params = ReleaseOptions.from({ ...this.params, resolved });
    //#endregion
  }

  //#region _
  public async _() {
    this.patch();
  }
  //#endregion

  //#region install:locally
  async installLocaly() {
    await this.project.__libVscodext.installLocaly(this.params);
    this._exit();
  }
  //#endregion

  async auto() {
    await this.start('patch', true);
  }

  async autoDocs() {}

  //#region major
  async major() {
    await this.start('major');
  }
  //#endregion

  //#region minor
  async minor() {
    await this.start('minor');
  }
  //#endregion

  //#region patch
  async patch() {
    await this.start('patch');
  }
  //#endregion

  //#region set minor version
  async setMinorVersion() {
    let children = Project.ins.Current.children as Project[];
    const minorVersionToSet = Number(
      _.first(this.args).trim().replace('v', ''),
    );

    for (let index = 0; index < children.length; index++) {
      const child = children[index] as Project;
      // if (child.minorVersion === minorVersionToSet) {
      //   Helpers.info(`[${child.name}] Minor version ${minorVersionToSet} alread set.`);
      // } else {
      Helpers.info(
        `[${child.name}] Updating minor version for ${child.name}@${child.__packageJson.data.version} => ${minorVersionToSet} ... `,
      );
      await child.__setMinorVersion(minorVersionToSet, true);
      // }

      // Helpers.taskDone();
    }
    this._exit();
  }
  //#endregion

  //#region set major version
  async setMajorVersion() {
    let children = this.project.children;

    const majorVersionToSet = Number(
      _.first(this.args).trim().replace('v', ''),
    );
    if (this.params.frameworkVersion) {
      if (
        !(await Helpers.questionYesNo(
          `Proceed with setting major version v${majorVersionToSet} and` +
            ` framework version v${this.params.frameworkVersion} for all ${children.length} packages ?`,
        ))
      ) {
        this._exit();
      }
    } else {
      if (
        !(await Helpers.questionYesNo(
          `Proceed with setting major version v${majorVersionToSet} for all ${children.length} packages ?`,
        ))
      ) {
        this._exit();
      }
    }

    for (let index = 0; index < children.length; index++) {
      const child = children[index] as Project;
      if (_.isString(this.params.frameworkVersion)) {
        if (child.__frameworkVersion === `v${this.params.frameworkVersion}`) {
          Helpers.info(
            `[${child.name}] Framwork version v${this.params.frameworkVersion} alread set.`,
          );
        } else {
          Helpers.info(
            `[${child.name}] Updating framework version for ${child.__frameworkVersion} => v${this.params.frameworkVersion} ... `,
          );
          await child.__setFramworkVersion(
            `v${this.params.frameworkVersion}` as CoreModels.FrameworkVersion,
          );
        }
      }
      if (child.majorVersion === majorVersionToSet) {
        Helpers.info(
          `[${child.name}] Major version ${majorVersionToSet} alread set.`,
        );
      } else {
        Helpers.info(
          `[${child.name}] Updating version for ${child.name}@${child.__packageJson.data.version} => ${majorVersionToSet} ... `,
        );
        await child.__setMajorVersion(majorVersionToSet);
      }
      // Helpers.taskDone();
    }
    this._exit();
  }
  //#endregion

  //#region start
  private async start(
    releaseType: CoreModels.ReleaseType = 'patch',
    automaticRelease: boolean = false,
  ) {
    Helpers.clearConsole();
    const releaseOptions = ReleaseOptions.from({
      ...this.params,
      releaseType,
      automaticRelease,
      skipProjectProcess: true,
      finishCallback: () => {
        this._exit();
      },
    });
    releaseOptions.specifiedVersion =
      this.args.find(
        k => k.startsWith('v') && Number(k.replace('v', '')) >= 3,
      ) || '';
    releaseOptions.shouldReleaseLibrary = await this.shouldReleaseLibMessage(
      releaseOptions,
      this.project,
    );
    await this.project.release(releaseOptions);
    this._exit();
  }
  //#endregion

  //#region should release lib
  async shouldReleaseLibMessage(
    releaseOptions: ReleaseOptions,
    project: Project,
  ) {
    //#region @backendFunc
    if (releaseOptions.automaticReleaseDocs) {
      return false;
    }
    let newVersion;
    if (releaseOptions.releaseType === 'major') {
      newVersion = project.__versionMajorPlusWithZeros;
    } else if (releaseOptions.releaseType === 'minor') {
      newVersion = project.__versionMinorPlusWithZeros;
    } else if (releaseOptions.releaseType === 'patch') {
      newVersion = project.__versionPatchedPlusOne;
    }

    // TODO detecting changes for children when start container

    if (project.__isSmartContainer) {
      Helpers.info(`Pacakges available for new version release:

${project.children.map(c => ` - @${project.name}/${c.name} v${newVersion}`).join('\n')}
`);
      const message = 'Proceed with lib release ?';

      return await Helpers.questionYesNo(message);
    }

    if (project.__isContainer && !project.__isSmartContainer) {
      Helpers.info(`Pacakges available for new version release:

    ${(releaseOptions.resolved || [])
      .map(
        (c, index) =>
          `(${index + 1}) ` +
          `${c.__isSmartContainer ? '@' + c.name + `/(${c.children.map(l => l.name).join(',')})` : c.name}` +
          `@${c.getVersionFor(releaseOptions.releaseType)}`,
      )
      .join(', ')}
    `);
      const message = `Proceed ${releaseOptions.automaticRelease ? '(automatic)' : ''} release of packages from ${project.genericName} ?`;
      if (!(await Helpers.questionYesNo(message))) {
        this._exit();
      }
      return true;
    } else {
      const message = `Proceed with release of new version: ${newVersion} ?`;
      return await Helpers.questionYesNo(message);
    }
    //#endregion
  }
  //#endregion
}

export default {
  $Release: Helpers.CLIWRAP($Release, '$Release'),
};
