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

    if (!Helpers.exists([location, config.file.taon_jsonc])) {
      /**
       * @deprecated
       */
      const firedevFilePath = crossPlatformPath([
        location,
        config.file.firedev_jsonc,
      ]);
      if (Helpers.exists(firedevFilePath)) {
        Helpers.writeFile(
          [location, config.file.taon_jsonc],
          Helpers.readFile(firedevFilePath),
        );
      } else {
        const tnpData = Helpers.readJson5([
          location,
          config.file.package_json,
        ])?.tnp;
        if (tnpData) {
          Helpers.writeJson5([location, config.file.taon_jsonc], tnpData);
        }
      }
      Helpers.removeFileIfExists(firedevFilePath);
    }
    const taon_json =
      Helpers.readJson5([location, config.file.taon_jsonc]) || {};

    const package_json = Helpers.readJson([location, config.file.package_json]);
    package_json[config.packageJsonFrameworkKey] = _.cloneDeep(taon_json);

    const pkgJson = new PackageJSON({ data: package_json, location, project });
    pkgJson.writeToDisc();

    return pkgJson;
    //#endregion
  }
}
