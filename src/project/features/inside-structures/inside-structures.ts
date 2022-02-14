//#region @backend
import { config, ConfigModels } from 'tnp-config';
import {
  path, _
} from 'tnp-core';

import { Helpers } from 'tnp-helpers';
import { FeatureForProject } from '../../abstract/feature-for-project';
import { Project } from '../../abstract/project/project';
import { InsideStruct, Opt } from './inside-struct';
import { angularAppFromV3IsomorphicLib } from './inside-structs';


export class InsideStructures extends FeatureForProject {

  recrate(outFolder: ConfigModels.OutFolder = 'dist') {

    const clients: Project[] = this.project.isWorkspaceChildProject
      ? this.project.parent.childrenThatAreLibs : [];

    const gitIgnoreFiles = [];

    const action = (client: Project) => {
      const structs = [
        angularAppFromV3IsomorphicLib(this.project)
      ];

      for (let index = 0; index < structs.length; index++) {
        const struct = structs[index];

        if (!struct) {
          continue;
        }

        const opt: Opt = { outFolder, projectName: this.project.name, client } as any;

        const replacement = (pathOrg) => {
          const replacedPart = struct.pathReplacements.reduce((a, b) => {
            return pathOrg
              .replace(b[0], b[1](opt))
              .replace('{{{outFolder}}}', outFolder)
              .replace('{{{client}}}', opt?.client?.name || '');
          }, pathOrg);
          return replacedPart;
        };
        opt.replacement = replacement;

        //#region copying files
        [
          ...struct.relateivePathesFromContainer,
        ].forEach(f => {
          const orgPath = path.join(struct.coreContainer.location, f);
          const destPath = path.join(
            this.project.location,
            replacement(f) || f,
            // f.replace('app/', `${tmpProjects}/`)
          );
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
        //#endregion

        //#region linking node_modules
        for (let index = 0; index < struct.linkNodeModulesTo.length; index++) {
          const f = struct.linkNodeModulesTo[index]
          const destPath = replacement(f);
          this.project.node_modules.linkTo(destPath);
        }
        //#endregion

        //#region linking files and folders
        for (let index = 0; index < struct.linksFuncs.length; index++) {
          const [fun1, fun2] = struct.linksFuncs[index]
          let from = fun1(opt);
          from = replacement(from);

          let to = fun2(opt);
          to = replacement(to);
          Helpers.createSymLink(from, to, { continueWhenExistedFolderDoesntExists: true });
        }
        //#endregion

        if (_.isFunction(struct.endAction)) {
          struct.endAction(opt);
        }
      }
    };

    if (clients.length > 0) {
      for (let index = 0; index < clients.length; index++) {
        const client = clients[index];
        action(client);
      }
    } else {
      action(this.project);
    }

    console.log(gitIgnoreFiles);

    return { gitIgnoreFiles };
  }

}

//#endregion