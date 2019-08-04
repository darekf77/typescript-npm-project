//#region @backend

import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as path from 'path';
import chalk from "chalk";

import { Project } from "../../abstract";
import { LibType, InstalationType, IPackageJSON, DependenciesFromPackageJsonStyle, UIFramework } from "../../../models";
import { tryRemoveDir, sortKeys as sortKeysInObjAtoZ, run, error, info, warn, log, HelpersLinks } from "../../../helpers";
import { config } from '../../../config';
import { PackageJsonBase } from './package-json-base.backend';
//#endregion

import * as _ from "lodash";
import { Morphi } from 'morphi';


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

  //#region @backend

  public static fromProject(project: Project) {
    return this.fromLocation(project.location, project);
  }
  public static fromLocation(location: string, project: Project = null, warings = true): PackageJSON {

    const isTnpProject = (location === config.pathes.tnp_folder_location);
    const filePath = path.join(location, 'package.json');
    if (!fs.existsSync(filePath)) {
      // warn(`No package.json in folder: ${path.basename(location)}`)
      return;
    }
    try {
      const file = fs.readFileSync(filePath, 'utf8').toString();
      const json = JSON.parse(file);
      if (!json.tnp && !isTnpProject) {
        // warn(`Unrecognized project type from location: ${location}`, false);
      }
      return new PackageJSON({ data: json, location, project });
    } catch (err) {
      error(`Error while parsing package.json in: ${filePath}`, true, true);
      error(err)
    }
  }


}

