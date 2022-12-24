//#region @backend
import {
  crossPlatformPath,
  path, _
} from 'tnp-core';
//#endregion
import { CLASS } from 'typescript-class-helpers';
import { config, ConfigModels } from 'tnp-config';

import { Helpers } from 'tnp-helpers';
import { FeatureForProject } from '../../abstract/feature-for-project';
import { Project } from '../../abstract/project/project';
import { InsideStruct, Opt } from './inside-struct';
import { InsideStructAngular13App, InsideStructAngular13Lib } from './structs';
import { BaseInsideStruct } from './structs/base-inside-struct';

const structs = {
  InsideStructAngular13App,
  InsideStructAngular13Lib
};

export class InsideStructures extends FeatureForProject {

  //#region field & getters
  readonly structures = {} as { [name in keyof typeof structs]: BaseInsideStruct; }
  readonly structuresWebsql = {} as { [name in keyof typeof structs]: BaseInsideStruct; }
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
    //#region @backend

    Object.keys(structs).forEach(s => {
      const structFn = structs[s] as typeof BaseInsideStruct;
      this.structures[CLASS.getName(structFn)] = new structFn(project, false);
    });

    Object.keys(structs).forEach(s => {
      const structFn = structs[s] as typeof BaseInsideStruct;
      this.structuresWebsql[CLASS.getName(structFn)] = new structFn(project, true);
    });

    //#endregion
  }


  //#region api

  //#region api / recreate
  public async recrate(outFolder: ConfigModels.OutFolder, watchBuild = true) {
    // console.log('recreate start')
    const clients: Project[] = this.project.isWorkspaceChildProject
      ? this.project.parent.childrenThatAreLibs : [];

    const action = async (client: Project) => {
      const structs = [
        ...Object.values(this.structures),
        ...Object.values(this.structuresWebsql)
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
        if (insideStruct?.struct?.linkNodeModulesTo) {
          for (let index = 0; index < insideStruct.struct.linkNodeModulesTo.length; index++) {
            const f = insideStruct.struct.linkNodeModulesTo[index]
            const destPath = path.join(client.location, replacement(f));
            this.project.node_modules.linkTo(destPath);
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
            Helpers.remove(to);
            Helpers.createSymLink(from, to, { continueWhenExistedFolderDoesntExists: true });
          }
        }
        //#endregion

        if (_.isFunction(insideStruct?.struct?.endAction)) {
          await Helpers.runSyncOrAsync(insideStruct.struct.endAction, opt);
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
