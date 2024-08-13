//#region imports
//#region @backend
import { PackageJsonBase } from './package-json-base.backend';
//#endregion
import {
  //#region @backend
  crossPlatformPath,
  path,
  fse,
  //#endregion
  _,
  Helpers,
} from 'tnp-core/src';

import type { Project } from '../../abstract/project';
import { config } from 'tnp-config/src';
//#endregion

export class PackageJSON
  //#region @backend
  extends PackageJsonBase
{
  //#endregion
  public static fromProject(project: Project) {
    return this.fromLocation(project.location, project);
  }
  public static fromLocation(
    location: string,
    project: Project = null,
    warings = true,
  ): PackageJSON {
    //#region @backendFunc

    const packageJsonPath = crossPlatformPath(
      path.join(location, config.file.package_json),
    );
    if (!Helpers.exists(packageJsonPath)) {
      return void 0;
    }

    if (!Helpers.exists([location, config.file.firedev_jsonc])) {
      const firedevJsonPath = crossPlatformPath([
        location,
        config.file.firedev_json,
      ]);
      const json5FilePath = crossPlatformPath([
        location,
        config.file.package_json__tnp_json5,
      ]);
      const jsonFilePath = crossPlatformPath([
        location,
        config.file.package_json__tnp_json,
      ]);
      if (Helpers.exists(json5FilePath)) {
        Helpers.writeFile(
          [location, config.file.firedev_jsonc],
          Helpers.readFile(json5FilePath),
        );
        Helpers.writeJson5(
          [location, config.file.firedev_jsonc],
          Helpers.readJson5([location, config.file.firedev_jsonc]),
        );
      } else if (Helpers.exists(jsonFilePath)) {
        Helpers.writeFile(
          [location, config.file.firedev_jsonc],
          Helpers.readFile(jsonFilePath),
        );
        Helpers.writeJson5(
          [location, config.file.firedev_jsonc],
          Helpers.readJson5([location, config.file.firedev_jsonc]),
        );
      } else if (Helpers.exists(firedevJsonPath)) {
        Helpers.writeFile(
          [location, config.file.firedev_jsonc],
          Helpers.readFile(firedevJsonPath),
        );
        Helpers.writeJson5(
          [location, config.file.firedev_jsonc],
          Helpers.readJson5([location, config.file.firedev_jsonc]),
        );
      } else {
        const tnpData = Helpers.readJson5([
          location,
          config.file.package_json,
        ])?.tnp;
        if (tnpData) {
          Helpers.writeJson5([location, config.file.firedev_jsonc], tnpData);
        }
      }
      Helpers.removeFileIfExists(json5FilePath);
      Helpers.removeFileIfExists(jsonFilePath);
    }
    const fifedev_json =
      Helpers.readJson5([location, config.file.firedev_jsonc]) || {};
    const package_json = Helpers.readJson([location, config.file.package_json]);
    package_json[config.packageJsonFrameworkKey] = _.cloneDeep(fifedev_json);

    const pkgJson = new PackageJSON({ data: package_json, location, project });
    pkgJson.writeToDisc();

    return pkgJson;
    //#endregion
  }
}
