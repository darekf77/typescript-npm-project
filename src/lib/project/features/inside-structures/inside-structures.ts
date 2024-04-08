//#region @backend
import {
  crossPlatformPath,
  path, _, CoreModels
} from 'tnp-core/src';
//#endregion
import { config } from 'tnp-config/src';

import { Helpers } from 'tnp-helpers/src';
import { BaseFeatureForProject } from 'tnp-helpers/src';
import { Project } from '../../abstract/project';
import { InsideStruct, Opt } from './inside-struct';
import { InsideStructAngular13App, InsideStructAngular13Lib } from './structs';
import { BaseInsideStruct } from './structs/base-inside-struct';
import { InitOptions } from '../../../build-options';

export class InsideStructures extends BaseFeatureForProject<Project> {

  //#region field & getters
  private insideStructAngular13AppNormal = new InsideStructAngular13App(this.project, false);
  private insideStructAngular13LibNormal = new InsideStructAngular13Lib(this.project, false);
  private insideStructAngular13AppWebsql = new InsideStructAngular13App(this.project, true);
  private insideStructAngular13LibWebsql = new InsideStructAngular13Lib(this.project, true);
  protected recreatedOnce = false;
  private _gitIgnoreFiles = [];
  private _npmIgnoreFiles = [];
  private _fileTemplates = [];
  get gitIgnore() {

    this.preventBeforeInit();
    return this._gitIgnoreFiles;
  }

  get npmIgnore() {
    this.preventBeforeInit();
    return this._npmIgnoreFiles;
  }

  get fileTemplates() {
    this.preventBeforeInit();
    return this._fileTemplates;
  }
  //#endregion

  constructor(project: Project) {
    super(project);
  }


  //#region api

  //#region api / recreate
  public async recrate(initOptions: InitOptions, watchBuild = true) {
    initOptions = InitOptions.from(initOptions);
    const outFolder = 'dist';
    const clients: Project[] = [];

    const action = async (client: Project) => {
      const structs: BaseInsideStruct[] = [
        this.insideStructAngular13AppNormal,
        this.insideStructAngular13LibNormal,
        this.insideStructAngular13AppWebsql,
        this.insideStructAngular13LibWebsql,
      ];

      for (let index = 0; index < structs.length; index++) {
        const insideStruct = structs[index];

        if (!insideStruct) {
          continue;
        }

        const opt: Opt = {
          outFolder,
          projectName: this.project.name,
          projectLocation: path.join(this.project.location),
          client,
          watchBuild,
        } as any;

        const replacement = (pathOrg) => {
          const replacedPart = insideStruct.struct.pathReplacements.reduce((a, b) => {
            return pathOrg
              .replace(b[0], b[1](opt))
              .replace('{{{outFolder}}}', outFolder)
              .replace('{{{client}}}', opt?.client?.name || '');
          }, pathOrg);
          return replacedPart;
        };
        opt.replacement = replacement;

        //#region copying files
        if (insideStruct?.struct?.relateivePathesFromContainer) {
          [
            ...insideStruct.struct.relateivePathesFromContainer,
          ].forEach(f => {
            const orgPath = crossPlatformPath(Helpers.resolve(path.join(insideStruct.struct.coreContainer.location, f)));
            const destPath = clearUnexistedLinks(path.join(
              this.project.location,
              replacement(f) || f,
              // f.replace('app/', `${tmpProjects}/`)
            ))

            if (orgPath !== destPath) {
              if (Helpers.isFolder(orgPath)) {
                Helpers.copy(orgPath, destPath);
              } else {
                Helpers.copyFile(orgPath, destPath);
              }
            } else {
              Helpers.warn(`${config.frameworkName} [initAngularAppStructure] trying to copy same thing:
              ${orgPath}
              `)
            }
          });
        }

        //#endregion

        //#region linking node_modules
        if (insideStruct?.struct?.linkNodeModulesTo && !initOptions.struct) {
          for (let index = 0; index < insideStruct.struct.linkNodeModulesTo.length; index++) {
            const f = insideStruct.struct.linkNodeModulesTo[index]
            const destPath = path.join(client.location, replacement(f));
            this.project.__node_modules.linkTo(destPath);
          }
        }
        //#endregion

        //#region linking files and folders
        if (insideStruct?.struct?.linksFuncs) {
          for (let index = 0; index < insideStruct.struct.linksFuncs.length; index++) {
            const [fun1, fun2] = insideStruct.struct.linksFuncs[index]
            let from = fun1(opt);
            from = path.join(client.location, replacement(from));

            let to = fun2(opt);
            to = path.join(client.location, replacement(to));
            if (!to || !from || (to === from)) {
              continue;
            }
            // console.log({
            //   from,
            //   to
            // })
            Helpers.remove(to);
            Helpers.createSymLink(from, to, { continueWhenExistedFolderDoesntExists: true });
          }
        }
        //#endregion

        if (_.isFunction(insideStruct?.struct?.endAction)) {

          await Helpers.runSyncOrAsync({
            functionFn: insideStruct.struct.endAction,
            arrayOfParams: [opt]
          });
        }
      }
    };

    if (clients.length > 0) {
      for (let index = 0; index < clients.length; index++) {
        const client = clients[index];
        await action(client);
      }
    } else {
      await action(this.project);
    }

    this.recreatedOnce = true;
    // console.log('recreate sdone')
  }
  //#endregion

  //#endregion

  //#region methods
  private preventBeforeInit() {
    if (!this.recreatedOnce) {
      Helpers.error(`[inside struct] Please recrete() project before accessing this`)
    }
  }
  //#endregion

}

function clearUnexistedLinks(pathToClear: string) {
  pathToClear = (crossPlatformPath(pathToClear) || '');
  const orgPath = pathToClear;
  const splited = pathToClear.split('/');
  let previous: string;
  do {
    splited.pop();
    var pathDir = splited.join('/');
    if (pathDir === previous) {
      return orgPath;
    }
    if (Helpers.isUnexistedLink(pathDir)) {
      Helpers.removeFileIfExists(pathDir);
      return orgPath;
    }
    previous = pathDir;
  } while (!!pathDir);
  return orgPath;
}
