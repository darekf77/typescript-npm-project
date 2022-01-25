import { _ } from "tnp-core";
//#region @backend
import { path } from "tnp-core";
//#endregion
import { config, ConfigModels } from "tnp-config";
import { Models } from "tnp-models";
import { Helpers } from 'tnp-helpers';


export class PackageJsonFile {
  static from(fullPath: string) {
    return new PackageJsonFile(fullPath);
  }
  private additionalSaveRequired = false;
  private readonly loadedContent: Models.npm.IPackageJSON;
  private readonly actuallProp: string;
  private constructor(
    public readonly fullPath: string) {
    //#region @backend
    let content = Helpers.readJson(fullPath, void 0, fullPath.endsWith('.json5')) as Models.npm.IPackageJSON;
    if (content && !content.name) {
      const actuallProp = path.basename(fullPath)
        .replace(config.file.package_json, '')
        .replace('.json5', '')
        .replace('.json', '');
      this.actuallProp = actuallProp;

      content = {
        [actuallProp]: content
      } as any as Models.npm.IPackageJSON;
    }
    const { additionalSaveRequired, packageJson } = fixTnpProps(content, fullPath);
    this.additionalSaveRequired = additionalSaveRequired;
    this.loadedContent = packageJson;
    //#endregion
  }


}


function fixTnpProps(
  packageJson: Models.npm.IPackageJSON,
  fullPath: string,
  additionalSaveRequired = false
): { additionalSaveRequired: boolean, packageJson: Models.npm.IPackageJSON } {
  //#region props consitency check
  if (!packageJson || !packageJson.tnp) {
    return { additionalSaveRequired: false, packageJson };
  }

  if (!packageJson.tnp.overrided) {
    packageJson.tnp.overrided = {};
    additionalSaveRequired = true;
  }
  if (_.isUndefined(packageJson.tnp.linkedProjects)) {
    packageJson.tnp.linkedProjects = [];
    additionalSaveRequired = true;
  }
  if (_.isUndefined(packageJson.tnp.libReleaseOptions)) {
    packageJson.tnp.libReleaseOptions = {
      nodts: false,
      obscure: false,
      ugly: false,
    };
    additionalSaveRequired = true;
  }
  if (_.isUndefined(packageJson.tnp.libReleaseOptions.nodts)) {
    packageJson.tnp.libReleaseOptions.nodts = false;
    additionalSaveRequired = true;
  }
  if (_.isUndefined(packageJson.tnp.libReleaseOptions.obscure)) {
    packageJson.tnp.libReleaseOptions.obscure = false;
    additionalSaveRequired = true;
  }
  if (_.isUndefined(packageJson.tnp.libReleaseOptions.ugly)) {
    packageJson.tnp.libReleaseOptions.ugly = false;
    additionalSaveRequired = true;
  }
  if (_.isUndefined(packageJson.tnp.overrided.linkedFolders)) {
    packageJson.tnp.overrided.linkedFolders = [];
    additionalSaveRequired = true;
  }
  if (!_.isArray(packageJson.tnp.overrided.ignoreDepsPattern)) {
    packageJson.tnp.overrided.ignoreDepsPattern = ['*'];
    additionalSaveRequired = true;
  }
  if (_.isUndefined(packageJson.tnp.overrided.includeAsDev)) {
    packageJson.tnp.overrided.includeAsDev = [];
    additionalSaveRequired = true;
  }
  if (!_.isArray(packageJson.tnp.overrided.includeOnly)) {
    packageJson.tnp.overrided.includeOnly = [];
    additionalSaveRequired = true;
  }
  if (!packageJson.tnp.overrided.dependencies) {
    packageJson.tnp.overrided.dependencies = {};
    additionalSaveRequired = true;
  }
  if (!packageJson.dependencies) {
    packageJson.dependencies = {};
    additionalSaveRequired = true;
  }
  if (!packageJson.devDependencies) {
    packageJson.devDependencies = {};
    additionalSaveRequired = true;
  }
  if (!_.isArray(packageJson.tnp.resources)) {
    packageJson.tnp.resources = [];
    additionalSaveRequired = true;
  }

  if (!(['navi', 'scenario'] as ConfigModels.LibType[]).includes(packageJson.tnp.type)) {
    (config.OVERRIDE_FROM_TNP as (any
      // keyof Models.npm.TnpIPackageJSONOverride
    )[]).forEach(propInPj => {
      const inPckageJson = packageJson[propInPj];
      const inTnp = packageJson.tnp[propInPj];
      if (_.isNil(inPckageJson) && !_.isNil(inTnp)) {
        packageJson[propInPj] = packageJson.tnp[propInPj];
      } else if (!_.isNil(inPckageJson) && _.isNil(inTnp)) {
        packageJson.tnp[propInPj] = packageJson[propInPj];
      }
      if (!_.isEqual(packageJson[propInPj], packageJson.tnp[propInPj])) { // TODO skechy
        packageJson[propInPj] = packageJson.tnp[propInPj];
        additionalSaveRequired = true;
      }
    });
  }

  if (packageJson.tnp && !(['navi'] as ConfigModels.LibType[]).includes(packageJson.tnp.type)) {
    packageJson.name = path.basename(fullPath);
  }
  delete packageJson.husky; // TODO QUICK_FIX annyoning shit


  return { additionalSaveRequired, packageJson }
  //#endregion
}
