//#region @backend
import * as fse from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import { PackageJsonBase } from './package-json-base.backend';
//#endregion

import * as _ from 'lodash';
import { Morphi } from 'morphi';
import type { Project } from '../../abstract';
import { Helpers } from 'tnp-helpers';
import { config, ConfigModels } from 'tnp-config';
import { Models } from 'tnp-models';

const OVERRIDE_FROM_TNP = [ // TODO put in config ?
  'scripts',
  'description',
  'license',
  'private',
  'author',
  'homepage',
  'main',
  'engines',
  'categories',
  'keywords',
  'activationEvents'
];

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
    if (!fse.existsSync(location)) {
      return void 0;
    }

    const filePath = {
      packgeJson: path.join(location, config.file.package_json),
      tnpJson: path.join(location, config.file.package_json__tnp_json),
    };

    let saveAtLoad = false;
    if (!fse.existsSync(filePath.packgeJson) && fse.existsSync(filePath.tnpJson)) {
      const tnpData = Helpers.readJson(filePath.tnpJson, void 0) as Models.npm.TnpData;
      if (!tnpData) {
        // warn(`No package.json (and bad package.json_tnp) in folder: ${path.basename(location)}`)
        return;
      }
      Helpers.info(`Recreating ${chalk.bold(path.basename(location))}/package.json from ${config.file.package_json__tnp_json} and npm registry...`);
      const nameFromFolder = path.basename(filePath.packgeJson);
      let lastVersionFromNpm: string;
      try {
        lastVersionFromNpm = Helpers.run(`npm show ${nameFromFolder} version`
          , { output: false }).sync().toString().trim();
      } catch (error) {
        Helpers.warn(`Not able to get last version of project: ${nameFromFolder} from npm registry...`)
      }
      const newPackageJson: Models.npm.IPackageJSON = {
        version: lastVersionFromNpm,
        name: nameFromFolder
      } as any;
      OVERRIDE_FROM_TNP.forEach(key => {
        newPackageJson[key] = tnpData[key];
      });
      Helpers.writeFile(filePath.packgeJson, newPackageJson);
    }


    if (!fse.existsSync(filePath.packgeJson)) {
      // warn(`No package.json in folder: ${path.basename(location)}`)
      return;
    }
    const existed = {};
    config.packageJsonSplit.forEach(c => {
      const filePathSplitTnp = path.join(location, c);

      // let existedTnp = void 0;
      if (fse.existsSync(filePathSplitTnp)) {
        try {
          const additionalSplitValue = Helpers.readJson(filePathSplitTnp, void 0);
          if (_.isObject(additionalSplitValue) && Object.keys(additionalSplitValue).length > 0) {
            existed[c] = additionalSplitValue as any;
          } else {
            // Helpers.warn(`[package-json] wrong content of ${c} in ${filePathSplitTnp}`)
          }
        } catch (error) {
          // Helpers.warn(`[package-json] not able to read: ${c}`)
        }
      } else {
        saveAtLoad = true;
      }
    })


    try {
      var json: Models.npm.IPackageJSON = Helpers.readJson(filePath.packgeJson) as any;

      if (!json.version) {
        json.version = '0.0.0';
        saveAtLoad = true;
      }

      config.packageJsonSplit.forEach(c => {

        if (_.isObject(existed[c])) {
          // Helpers.log(`Assign existed ${c} for ${filePath}`);
          const property = c
            .replace(`${config.file.package_json}_`, '')
            .replace(`.json`, '');
          json[property] = existed[c] as any;
        }
      });



      if (json.tnp) {
        if (!json.tnp.overrided) {
          json.tnp.overrided = {};
          saveAtLoad = true;
        }
        if (_.isUndefined(json.tnp.linkedProjects)) {
          json.tnp.linkedProjects = [];
          saveAtLoad = true;
        }
        if (_.isUndefined(json.tnp.libReleaseOptions)) {
          json.tnp.libReleaseOptions = {
            nodts: false,
            obscure: false,
            ugly: false,
          };
          saveAtLoad = true;
        }
        if (_.isUndefined(json.tnp.libReleaseOptions.nodts)) {
          json.tnp.libReleaseOptions.nodts = false;
          saveAtLoad = true;
        }
        if (_.isUndefined(json.tnp.libReleaseOptions.obscure)) {
          json.tnp.libReleaseOptions.obscure = false;
          saveAtLoad = true;
        }
        if (_.isUndefined(json.tnp.libReleaseOptions.ugly)) {
          json.tnp.libReleaseOptions.ugly = false;
          saveAtLoad = true;
        }
        if (_.isUndefined(json.tnp.overrided.linkedFolders)) {
          json.tnp.overrided.linkedFolders = [];
          saveAtLoad = true;
        }
        if (!_.isArray(json.tnp.overrided.ignoreDepsPattern)) {
          json.tnp.overrided.ignoreDepsPattern = ["*"];
          saveAtLoad = true;
        }
        if (_.isUndefined(json.tnp.overrided.includeAsDev)) {
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

        if (!(['navi', 'scenario'] as ConfigModels.LibType[]).includes(json.tnp.type)) {
          (OVERRIDE_FROM_TNP as (any
            // keyof Models.npm.TnpIPackageJSONOverride
          )[]
          ).forEach(key => {
            const inPckageJson = json[key];
            const inTnp = json.tnp[key];
            if (_.isNil(inPckageJson) && !_.isNil(inTnp)) {
              json[key] = json.tnp[key];
            } else if (!_.isNil(inPckageJson) && _.isNil(inTnp)) {
              json.tnp[key] = json[key];
            }
            if (!_.isEqual(json[key], json.tnp[key])) {
              json[key] = json.tnp[key];
              saveAtLoad = true;
            }
          });
        }
      }

      if (json.tnp && !(['navi'] as ConfigModels.LibType[]).includes(json.tnp.type)) {
        json.name = path.basename(location);
      }
      var pkgJson = new PackageJSON({ data: json, location, project });

    } catch (err) {
      Helpers.error(`Error while parsing package.json in: ${filePath}`, false, true);
      return;
    }

    if (saveAtLoad) {
      Helpers.log(`Saving fixed package.json structure in ${location}`);
      pkgJson.writeToDisc()
    }
    return pkgJson;
  }


  //#endregion
}
