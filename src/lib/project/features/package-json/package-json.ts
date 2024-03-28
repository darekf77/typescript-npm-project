//#region imports
//#region @backend
import { PackageJsonBase } from './package-json-base.backend';
//#endregion
import {
  //#region @backend
  crossPlatformPath, path, fse,
  //#endregion
  _, Helpers
} from 'tnp-core/src';
import { Morphi } from 'morphi/src';
import type { Project } from '../../abstract/project';
import { PackageJsonFile } from './package-json-file';
import { config } from 'tnp-config/src';
//#endregion
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

    const packageJsonPath = crossPlatformPath(path.join(location, config.file.package_json));
    if (!Helpers.exists(packageJsonPath)) {
      return void 0;
    }

    const pj = PackageJsonFile.from(packageJsonPath);
    let pj_tnp = PackageJsonFile.from(crossPlatformPath(path.join(location, config.file.package_json__tnp_json)));
    const pj_tnp5 = PackageJsonFile.from(crossPlatformPath(path.join(location, config.file.package_json__tnp_json5)));

    if (pj_tnp.exists && pj_tnp5.exists) {
      fse.unlinkSync(pj_tnp.fullPath)
    }

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
    if (pj.saveAtLoad || (!pj_tnp5.exists && config.activeFramewrokVersions.includes(pkgJson.data.tnp.version))) {
      Helpers.log(`Saving fixed package.json structure in ${location}`, 1);

      pkgJson.writeToDisc();


    }

    return pkgJson;
    //#endregion
  }



}
