//#region @backend
import * as _ from 'lodash';
import * as path from 'path';
import * as fse from 'fs-extra';
import { SingularBuild } from '../features/singular-build.backend';
import { Project } from '../abstract';
//#endregion
import { BuildOptions } from 'tnp-db';
import { Helpers } from 'tnp-helpers';
import { CLASS } from 'typescript-class-helpers';

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
      this.packageJson.writeToDiscSync();
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
    return [

    ];
    //#endregion
  }

  async buildSteps(buildOptions?: BuildOptions) {
    //#region @backend
    if (!fse.existsSync(this.location)) {
      return;
    }
    const { prod, watch, outDir, args, appBuild } = buildOptions;

    await (new SingularBuild(this)).init(watch, prod);
    //#endregion
  }
}
