import { CoreModels, _, chalk, path } from "tnp-core/src";
import { Helpers } from "tnp-helpers/src";
import { CommandLineFeature } from "tnp-helpers/src";
import { Project } from "../abstract/project";
import { BuildOptions, ReleaseOptions } from "../../build-options";
import { Models } from "../../models";
import { config } from "tnp-config/src";

//#region should release lib
const shouldReleaseLibMessage = async (
  releaseOptions: ReleaseOptions,
  project: Project,
) => {
  //#region @backendFunc
  if (releaseOptions.automaticReleaseDocs) {
    return false;
  }
  let newVersion;
  if (releaseOptions.releaseType === 'major') {
    newVersion = project.__versionMajorPlusWithZeros
  } else if (releaseOptions.releaseType === 'minor') {
    newVersion = project.__versionMinorPlusWithZeros;
  } else if (releaseOptions.releaseType === 'patch') {
    newVersion = project.__versionPatchedPlusOne;
  }

  // TODO detecting changes for children when start container

  if (project.__isSmartContainer) {
    Helpers.info(`Pacakges available for new version release:

${project.children.map((c) => ` - @${project.name}/${c.name} v${newVersion}`).join('\n')}
`);
    const message = 'Proceed with lib release ?';

    return await Helpers.questionYesNo(message);
  }

  if (project.__isContainer && !project.__isSmartContainer) {
    const message = `Proceed with release of packages from ${project.genericName} ?`;
    return await Helpers.questionYesNo(message);
  } else {
    const message = `Proceed with release of new version: ${newVersion} ?`;
    return await Helpers.questionYesNo(message);
  }
  //#endregion
};
//#endregion

class $Release extends CommandLineFeature<ReleaseOptions, Project> {
  resolved: Project[];
  __initialize__() {
    //#region resolve smart containter
    let resolved = [];

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
    } else if (this.project.__isContainer) {
      resolved = Helpers.cliTool.resolveItemsFromArgsBegin<Project>(this.args, (a) => {
        return Project.ins.From(path.join(this.project.location, a));
      })?.allResolved;

      const otherDeps = this.project.children.filter(c => {
        return !resolved.includes(c);
      });

      resolved = Project.sortGroupOfProject<Project>([
        ...resolved,
        ...otherDeps,
      ], (proj) => proj.__packageJson.data?.tnp?.overrided?.includeOnly || [], proj => proj.name)
        .filter(d => d.name !== this.project.name);

    }
    this.params = ReleaseOptions.from({ ...this.params, resolved });
    //#endregion
  }

  //#region _
  public async _() {
    this.patch()
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

  async autoDocs() {

  }

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
  async setMinorVer() {

    let children = (Project.ins.Current.children as Project[]);
    const minorVersionToSet = Number(_.first(this.args).trim().replace('v', ''));

    for (let index = 0; index < children.length; index++) {
      const child = children[index] as Project;
      // if (child.minorVersion === minorVersionToSet) {
      //   Helpers.info(`[${child.name}] Minor version ${minorVersionToSet} alread set.`);
      // } else {
      Helpers.info(`[${child.name}] Updating minor version for ${child.name}@${child.__packageJson.data.version} => ${minorVersionToSet} ... `);
      await child.__setMinorVersion(minorVersionToSet, true);
      // }

      // Helpers.taskDone();
    }
    this._exit();
  }
  //#endregion

  //#region set major version
  async setMajorVer() {

    let children = this.project.children;

    const majorVersionToSet = Number(_.first(this.args).trim().replace('v', ''));
    if (this.params.frameworkVersion) {
      if (!(await Helpers.questionYesNo(`Proceed with setting major version v${majorVersionToSet} and`
        + ` framework version v${this.params.frameworkVersion} for all ${children.length} packages ?`))) {
        this._exit();
      }
    } else {
      if (!(await Helpers.questionYesNo(`Proceed with setting major version v${majorVersionToSet} for all ${children.length} packages ?`))) {
        this._exit();
      }
    }

    for (let index = 0; index < children.length; index++) {
      const child = children[index] as Project;
      if (_.isString(this.params.frameworkVersion)) {
        if (child.__frameworkVersion === `v${this.params.frameworkVersion}`) {
          Helpers.info(`[${child.name}] Framwork version v${this.params.frameworkVersion} alread set.`);
        } else {
          Helpers.info(`[${child.name}] Updating framework version for ${child.__frameworkVersion} => v${this.params.frameworkVersion} ... `);
          await child.__setFramworkVersion(`v${this.params.frameworkVersion}` as CoreModels.FrameworkVersion);
        }
      }
      if (child.majorVersion === majorVersionToSet) {
        Helpers.info(`[${child.name}] Major version ${majorVersionToSet} alread set.`);
      } else {
        Helpers.info(`[${child.name}] Updating version for ${child.name}@${child.__packageJson.data.version} => ${majorVersionToSet} ... `);
        await child.__setMajorVersion(majorVersionToSet);
      }
      // Helpers.taskDone();
    }
    this._exit();
  }
  //#endregion

  //#region start
  private async start(releaseType: Models.ReleaseType = 'patch', automaticRelease: boolean = false) {

    const releaseOptions = ReleaseOptions.from({
      ...this.params,
      releaseType,
      automaticRelease,
      finishCallback: () => {
        this._exit();
      }
    });
    releaseOptions.specifiedVersion = this.args.find(k => k.startsWith('v') && Number(k.replace('v', '')) >= 3) || '';
    releaseOptions.shouldReleaseLibrary = await shouldReleaseLibMessage(releaseOptions, this.project);
    await this.project.release(releaseOptions);
    this._exit();
  }
  //#endregion

}

export default {
  $Release: Helpers.CLIWRAP($Release, '$Release'),
}
