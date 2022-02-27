import {
  //#region @backend
  path,
  //#endregion
  _
} from 'tnp-core';
import { ConfigModels } from 'tnp-config';
import { Helpers } from 'tnp-helpers';
import { Project } from '../../../abstract/project/project';
import { config } from 'tnp-config';
import { Models } from 'tnp-models';
import { CLASS } from 'typescript-class-helpers';
import { BaseInsideStruct } from './base-inside-struct';
import { InsideStruct } from '../inside-struct';

@CLASS.NAME('InsideStructAngular13Lib')
export class InsideStructAngular13Lib extends BaseInsideStruct {
  private constructor(project: Project) {
    super(project);
    //#region @backend
    if (!project.frameworkVersionAtLeast('v3')) {
      return
    }

    const projectDestLocation = `tmp-projects-for-{{{outFolder}}}/${project.name}`;

    const result = InsideStruct.from({
      relateivePathesFromContainer: [
        'projects/my-lib/tsconfig.spec.json',
        'projects/my-lib/tsconfig.lib.prod.json',
        'projects/my-lib/tsconfig.lib.json',
        'projects/my-lib/README.md',
        'projects/my-lib/package.json',
        'projects/my-lib/ng-package.json',
        'projects/my-lib/karma.conf.js',
        ...(project.typeIs('isomorphic-lib') ? ['angular.json.filetemplate'] : [])
      ],
      projtectType: project._type,
      frameworkVersion: project._frameworkVersion,
      pathReplacements: [
        [
          'projects/my-lib',
          ({ client, outFolder, projectName }) => projectDestLocation
            .replace(`{{{outFolder}}}`, outFolder),
        ],
      ],
      endAction: ({ replacement, outFolder, projectLocation }) => {
        const destProjectLocation = replacement(projectDestLocation);
        const fromSource = path.join(project.location, project.typeIs('angular-lib')
          ? config.folder.components : config.folder.tmpFor(outFolder));

        const destSource = path.join(projectLocation, destProjectLocation, config.folder.src);

        Helpers.remove(destSource);
        Helpers.createSymLink(fromSource, destSource, { continueWhenExistedFolderDoesntExists: true });

        const sourceFolder = project.typeIs('angular-lib') ? config.folder.components : config.folder.src;
        const publicApi = path.join(project.location, sourceFolder, config.file.publicapi_ts);
        const indexTs = path.join(project.location, sourceFolder, config.file.index_ts);
        if (!Helpers.exists(publicApi) && Helpers.exists(indexTs)) {
          Helpers.copyFile(indexTs, publicApi);
        }

        //#region fix out
        if (outFolder !== 'dist') {
          const ngPackgeJsonPath = path.join(projectLocation, destProjectLocation, 'ng-package.json');
          const jsonNgPackgage = Helpers.readJson(ngPackgeJsonPath);
          jsonNgPackgage.dest = jsonNgPackgage.dest.replace('dist', outFolder);
          Helpers.writeJson(ngPackgeJsonPath, jsonNgPackgage);

          // TODO QUCIK_FIX
          const angularJsPath = path.join(project.location, config.file.angular_json);
          const angularJs = Helpers.readFile(angularJsPath);
          const modifiedAngularJson = angularJs
            .replace(new RegExp(Helpers.escapeStringForRegEx('tmp-projects-for-dist'), 'g'),
              `tmp-projects-for-${outFolder}`);
          Helpers.writeFile(angularJsPath, modifiedAngularJson);
        }
        //#endregion

        // //#region handle package json
        const jsonPath = path.join(projectLocation, destProjectLocation, config.file.package_json);
        const json = Helpers.readJson(jsonPath) as Models.npm.IPackageJSON;
        json.name = project.name; //
        json.version = project.version;
        json.peerDependencies = void 0;
        json.devDependencies = {};
        json.dependencies = {};
        Helpers.writeJson(jsonPath, json);
        //#endregion
      },
    });

    // @ts-ignore
    this.struct = result;

    //#endregion
  }

}



// function initAngularLibStructure(outFolder: ConfigModels.OutFolder = 'dist') {
//   //#region @backendFunc
//   const project: Project = this.project;
//   const tmpProjects = `tmp-projects-for-${outFolder}/${project.name}`;
//   const projectsLocation = path.join(project.location, tmpProjects);
//   Helpers.removeFolderIfExists(projectsLocation);
//   const angularLibCore = Project.by('angular-lib', project._frameworkVersion) as Project;

//   [
//     ...angularLibCore.angularCoreLibFiles,
//     ...(project.typeIs('isomorphic-lib') ? ['angular.json.filetemplate'] : [])
//   ].forEach(f => {
//     const orgPath = path.join(angularLibCore.location, f);
//     const destPath = path.join(
//       project.location,
//       f.replace('projects/my-lib',
//         tmpProjects));
//     if (orgPath !== destPath) {
//       if (Helpers.isFolder(orgPath)) {
//         Helpers.copy(orgPath, destPath);
//       } else {
//         Helpers.copyFile(orgPath, destPath);
//       }
//     } else {
//       Helpers.warn(`${config.frameworkName} [initAngularLibStructure] trying to copy same thing:
//       ${orgPath}
//       `)
//     }
//   });
//   const from = path.join(project.location, project.typeIs('angular-lib')
//     ? config.folder.components : config.folder.tmpFor(outFolder));
//   const dest = path.join(projectsLocation, config.folder.src);

//   Helpers.remove(dest);
//   Helpers.createSymLink(from, dest, { continueWhenExistedFolderDoesntExists: true });

//   const sourceFolder = project.typeIs('angular-lib') ? config.folder.components : config.folder.src;
//   const publicApi = path.join(project.location, sourceFolder, config.file.publicapi_ts);
//   const indexTs = path.join(project.location, sourceFolder, config.file.index_ts);
//   if (!Helpers.exists(publicApi) && Helpers.exists(indexTs)) {
//     Helpers.copyFile(indexTs, publicApi);
//   }

//   //#region fix out
//   if (outFolder !== 'dist') {
//     const ngPackgeJsonPath = path.join(projectsLocation, 'ng-package.json');
//     const jsonNgPackgage = Helpers.readJson(ngPackgeJsonPath);
//     jsonNgPackgage.dest = jsonNgPackgage.dest.replace('dist', outFolder);
//     Helpers.writeJson(ngPackgeJsonPath, jsonNgPackgage);

//     // TODO QUCIK_FIX
//     const angularJsPath = path.join(project.location, config.file.angular_json);
//     const angularJs = Helpers.readFile(angularJsPath);
//     const modifiedAngularJson = angularJs
//       .replace(new RegExp(Helpers.escapeStringForRegEx('tmp-projects-for-dist'), 'g'),
//         `tmp-projects-for-${outFolder}`);
//     Helpers.writeFile(angularJsPath, modifiedAngularJson);
//   }
//   //#endregion

//   // //#region handle package json
//   const jsonPath = path.join(projectsLocation, config.file.package_json);
//   const json = Helpers.readJson(jsonPath) as Models.npm.IPackageJSON;
//   json.name = project.name; //
//   json.version = project.version;
//   json.peerDependencies = void 0;
//   json.devDependencies = {};
//   json.dependencies = {};
//   Helpers.writeJson(jsonPath, json);
//   //#endregion
//   //#endregion
// }
