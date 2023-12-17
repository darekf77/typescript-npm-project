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
import { argsToClear } from '../../constants';

//#region @backend
@CLASS.NAME('ProjectContainer')
//#endregion
export class ProjectContainer
  //#region @backend
  extends Project
//#endregion
{

  async initProcedure() {
    //#region @backendFunc
    this.addGitReposAsLinkedProjects();
    //#endregion
  }

  public addGitReposAsLinkedProjects() {
    //#region @backendFunc
    const repoChilds = this.getFolders()
      .sort()
      .map(c => {
        const proj = Project.From<Project>(c);
        if (!proj) {
          Helpers.log(`No project from ${c}`);
        }
        return proj;
      })
      .filter(f => !!f)
      .filter(c => c.git.isGitRoot)
      .map(c => c.name);


    // TODO Too much things to check here
    // let chagned = false;

    // repoChilds.forEach(name => {
    //   if (_.isUndefined(this.packageJson.linkedProjects.find(p => p === name))
    //     && Project.From<Project>(path.join(this.location, name))?.git.isGitRepo) {
    //     chagned = true;
    //     this.packageJson.linkedProjects.push(name);
    //   }
    // });
    // if (chagned) {
    //   this.packageJson.writeToDisc();
    // }
    //#endregion
  }

  async buildLib() { }

  filesTemplates() {
    let templates = super.filesTemplates();
    if (this.isSmartContainer) {
      templates = [
        'tsconfig.json.filetemplate',
        ...templates,
      ]
    }
    return templates;
  }

  startOnCommand() {
    //#region @backendFunc
    return 'echo "no container support jet"';
    //#endregion
  }

  projectSpecyficFiles(): string[] {
    //#region @backendFunc
    if (this.isSmartContainer) {
      return [
        ...this.filesTemplates(),
        // 'tsconfig.json',
        // ...this.vscodeFileTemplates,
      ]
    }
    return [

    ];
    //#endregion
  }

  proxyProjFor(client: string, outFolder: Models.dev.BuildDir): ProjectIsomorphicLib {
    return Project.From(SingularBuild.getProxyProj(this, client, outFolder)) as any
  }

  async buildSteps(buildOptions?: BuildOptions, libBuildDone?: () => void) {
    //#region @backend
    if (!fse.existsSync(this.location)) {
      return;
    }
    let { outDir, args } = buildOptions;

    args = Helpers.cliTool.removeArgFromString(args, argsToClear);
    let client = Helpers.removeSlashAtEnd(_.first((args || '').split(' '))) as any;
    if (!client) {
      client = this.smartContainerBuildTarget?.name;
    }

    const proxyForTarget = this.proxyProjFor(this.smartContainerBuildTarget?.name, outDir);
    if (!proxyForTarget) {
      Helpers.error(`Please start lib build for smart container:
     ${config.frameworkName} build:dist:watch
     or
     ${config.frameworkName} dev
     or
     ${config.frameworkName} build:watch # for global build

      `, false, true)
    }

    let proxy = this.proxyProjFor(client, outDir);

    if (!proxy && this.isSmartContainer) {
      const tmp = (c) => `${config.frameworkName} build:app:watch ${c}`;
      Helpers.error(`

      Please provide target for angular build:

${this.children.filter(c => c.typeIs('isomorphic-lib')).map(c => {
        return tmp(c.name);
      }).join('\n')}

      or please update:
      ...
      linkedProjects: [ ... ]
      ...
      in you configuraiton and run: firedev init


      `, false, true);
    }
    await proxy.buildSteps(buildOptions, libBuildDone);

    //#endregion
  }
}
