//#region imports
//#region @backend
import { _ } from 'tnp-core';
import { path } from 'tnp-core'
import { fse } from 'tnp-core'
import { SingularBuild } from '../features/singular-build.backend';
import { Project } from '../abstract';
//#endregion
import { BuildOptions } from 'tnp-db';
import { Helpers } from 'tnp-helpers';
import { CLASS } from 'typescript-class-helpers';
import type { ProjectIsomorphicLib } from './project-isomorphic-lib';
import { Models } from 'tnp-models';
import { config } from 'tnp-config';
//#endregion

//#region @backend
@CLASS.NAME('ProjectContainer')
//#endregion
export class ProjectContainer
  //#region @backend
  extends Project
//#endregion
{

  //#region static
  public static handleSmartContainer(smartContainerOrChild: Project, client: string) { // TODO everything will be in src
    if (!smartContainerOrChild.isSmartContainer && !smartContainerOrChild.isSmartContainerChild) {
      return;
    }
    if (!client) {
      Helpers.error(`Trying to init project ${smartContainerOrChild.name} without target.`, false, true);
    }

    const parent = smartContainerOrChild.isSmartContainerChild ? smartContainerOrChild.parent : smartContainerOrChild;

    const nodeModulesContainer = path.join(parent.location, config.folder.node_modules, `@${parent.name}`);

    if (Helpers.isUnexistedLink(nodeModulesContainer)) {
      Helpers.remove(nodeModulesContainer);
    }

    if (Helpers.isExistedSymlink(nodeModulesContainer) && !Helpers.isFolder(nodeModulesContainer)) {
      Helpers.remove(nodeModulesContainer);
    }
    if (!Helpers.exists(nodeModulesContainer)) {
      Helpers.mkdirp(nodeModulesContainer);
    }

    if (client) {
      const childrens = parent.children.filter(f => f.typeIs('isomorphic-lib') && f.frameworkVersionAtLeast('v3'));
      for (let index = 0; index < childrens.length; index++) {
        const child = childrens[index];
        const source = path.join(
          parent.location,
          config.folder.dist,
          parent.name,
          client,
          config.folder.dist,
          config.folder.libs,
          child.name,
        );
        const dest = path.join(nodeModulesContainer, child.name);
        if (!Helpers.exists(path.dirname(dest))) {
          Helpers.mkdirp(path.dirname(dest));
        }
        Helpers.removeFileIfExists(dest);
        // console.log(source)
        Helpers.createSymLink(source, dest, { continueWhenExistedFolderDoesntExists: true });
      }
    }
  }

  //#endregion

  async buildLib() { }

  startOnCommand() {
    //#region @backendFunc
    return 'echo "no container support jet"';
    //#endregion
  }

  projectSpecyficFiles(): string[] {
    //#region @backendFunc
    if (this.isSmartContainer) {
      return [
        // 'angular.json'
        // 'tsconfig.json',
        // ...this.vscodeFileTemplates,
        // '.vscode/launch.json'
      ]
    }
    return [

    ];
    //#endregion
  }

  proxyProjFor(client: string, outFolder: Models.dev.BuildDir): ProjectIsomorphicLib {
    return Project.From(SingularBuild.getProxyProj(this, client, outFolder)) as any
  }

  async buildSteps(buildOptions?: BuildOptions) {
    //#region @backend
    if (!fse.existsSync(this.location)) {
      return;
    }
    let { outDir, client, clientArgString } = buildOptions;


    const proxy = this.proxyProjFor(client.name, outDir);
    if (!proxy && this.isSmartContainer) {
      const tmp = (c) => `${config.frameworkName} build:app:watch ${c} `;
      Helpers.error(`

      Please provide target for angular build:


${this.children.filter(c => c.typeIs('isomorphic-lib')).map(c => {
        return tmp(c.name);
      }).join('\n')}


      `, false, true);
    }
    await proxy.buildSteps(buildOptions);

    //#endregion
  }
}
