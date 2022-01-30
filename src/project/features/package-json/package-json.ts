//#region @backend
import { PackageJsonBase } from './package-json-base.backend';
//#endregion

import { crossPlatformPath, Helpers, path, _ } from 'tnp-core';
import { Morphi } from 'morphi';
import type { Project } from '../../abstract';
import { PackageJsonFile } from './package-json-file';
import { config } from 'tnp-config';

@Morphi.Entity<PackageJSON>({
  className: 'PackageJSON',
  //#region @backend
  createTable: false
  //#endregion
})
export class PackageJSON
  //#region @backend
  extends PackageJsonBase
//#endregion
{
  public static fromProject(project: Project) {
    return this.fromLocation(project.location, project);
  }
  public static fromLocation(location: string, project: Project = null, warings = true)
    : PackageJSON {

    //#region @backendFunc
    const pj = PackageJsonFile.from(crossPlatformPath(path.join(location, config.file.package_json)));
    const pj_tnp = PackageJsonFile.from(crossPlatformPath(path.join(location, config.file.package_json__tnp_json)));
    const pj_tnp5 = PackageJsonFile.from(crossPlatformPath(path.join(location, config.file.package_json__tnp_json5)));

    if (!pj.exists && !pj_tnp.exists && !pj_tnp5.exists) {
      return;
    } else if (!pj.isReadable && !pj_tnp.isReadable && !pj_tnp5.isReadable) {

      Helpers.error(`[package-json][incorrect files] Error while parsing files:
      - ${config.file.package_json}
      - ${config.file.package_json__tnp_json}
      - ${config.file.package_json__tnp_json5}

      in ${location}
       `, false, true);

    } else if (pj_tnp5.isReadable) {
      pj.mergeWith(pj_tnp5);
    } else if (pj_tnp.isReadable) {
      pj.mergeWith(pj_tnp);
    }

    pj.lastChecks();

    const pkgJson = new PackageJSON({ data: pj.data, location, project });
    if (pj.saveAtLoad) {
      Helpers.log(`Saving fixed package.json structure in ${location}`);
      pkgJson.writeToDisc();
    }

    return pkgJson;
    //#endregion
  }



}
