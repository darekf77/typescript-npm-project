//#region @backend

import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as path from 'path';
import chalk from "chalk";

import { Project } from "../../abstract";
import { tryRemoveDir, sortKeys as sortKeysInObjAtoZ, run, error, info, warn, log, HelpersLinks } from "../../../helpers";
import { config } from '../../../config';
import { PackageJsonBase } from './package-json-base.backend';
//#endregion

import * as _ from "lodash";
import { Morphi } from 'morphi';
import { IPackageJSON, DependenciesFromPackageJsonStyle } from '../../../models/ipackage-json';


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
    if(!fse.existsSync(location)) {
      return void 0;
    }
    const isTnpProject = (location === config.pathes.tnp_folder_location);
    const filePath = path.join(location, 'package.json');
    if (!fs.existsSync(filePath)) {
      // warn(`No package.json in folder: ${path.basename(location)}`)
      return;
    }
    try {
      const file = fs.readFileSync(filePath, 'utf8').toString();
      const json: IPackageJSON = JSON.parse(file) as any;
      if (!json.tnp && !isTnpProject) {
        // warn(`Unrecognized project type from location: ${location}`, false);
      }
      var saveAtLoad = false;
      if (json.tnp) {
        if (!json.tnp.overrided) {
          json.tnp.overrided = {};
          saveAtLoad = true;
        }
        if (!_.isArray(json.tnp.overrided.ignoreDepsPattern)) {
          json.tnp.overrided.ignoreDepsPattern = [];
          saveAtLoad = true;
        }
        if (!_.isArray(json.tnp.overrided.includeAsDev)) {
          json.tnp.overrided.includeAsDev = [];
          saveAtLoad = true;
        }
        if (!_.isArray(json.tnp.overrided.includeOnly)) {
          json.tnp.overrided.includeOnly = [];
          saveAtLoad = true;
        }
        if (!json.tnp.overrided.dependencies) {
          json.tnp.overrided.dependencies = {};
          saveAtLoad = true;
        }
        if (!json.dependencies) {
          json.dependencies = {};
          saveAtLoad = true;
        }
        if (!json.devDependencies) {
          json.devDependencies = {};
          saveAtLoad = true;
        }
        if (!_.isArray(json.tnp.resources)) {
          json.tnp.resources = [];
          saveAtLoad = true;
        }
      }
      var pkgJson = new PackageJSON({ data: json, location, project });

    } catch (err) {
      error(`Error while parsing package.json in: ${filePath}`, true, true);
      error(err)
      return;
    }
    if (saveAtLoad) {
      log(`Saving fixed package.json structure`);
      pkgJson.writeToDisc()
    }
    return pkgJson;
  }

  private restrictVersions(obj: DependenciesFromPackageJsonStyle) {
    Object.keys(obj).forEach(name => {
      if (obj[name].startsWith('^')) {
        obj[name] = obj[name].slice(1)
      }
      if (obj[name].startsWith('~')) {
        obj[name] = obj[name].slice(1)
      }
    });
  }



  //#endregion
}

