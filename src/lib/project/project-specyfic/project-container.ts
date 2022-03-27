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
      .map(c => {
        const proj = Project.From<Project>(c);
        if (!proj) {
          Helpers.info(`No project from ${c}`);
        }
        return proj;
      })
      .filter(f => !!f)
      .filter(c => c.git.isGitRoot).map(c => c.name);
    let chagned = false;

    repoChilds.forEach(name => {
      if (_.isUndefined(this.packageJson.linkedProjects.find(p => p === name))
        && Project.From<Project>(path.join(this.location, name))?.git.isGitRepo) {
        chagned = true;
        this.packageJson.linkedProjects.push(name);
      }
    });
    if (chagned) {
      this.packageJson.writeToDisc();
    }
    //#endregion
  }

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
        'tsconfig.json',
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
    const { outDir, args } = buildOptions;

    const proxy = this.proxyProjFor(_.first(args.split(' ')).trim(), outDir);
    await proxy.buildSteps(buildOptions);

    //#endregion
  }
}
