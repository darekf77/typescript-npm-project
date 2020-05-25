//#region @backend
import * as _ from 'lodash';
import * as path from 'path';
import * as fse from 'fs-extra';
import { Project } from '../abstract';
import { BuildOptions } from 'tnp-db';
import { Helpers } from 'tnp-helpers';
import { SingularBuild } from '../features/singular-build.backend';
import { CLASS } from 'typescript-class-helpers';

@CLASS.NAME('ProjectContainer')
export class ProjectContainer extends Project {

  async initProcedure() {
    this.addGitReposAsLinkedProjects();
  }

  public addGitReposAsLinkedProjects() {
    // console.log('this.getFolders()', this.getFolders())
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
    // console.log(this.packageJson.linkedProjects.map(c => c.name))
    repoChilds.forEach(name => {
      // console.log('name', name)
      if (_.isUndefined(this.packageJson.linkedProjects.find(p => p === name))
        && Project.From<Project>(path.join(this.location, name))?.git.isGitRepo) {
        chagned = true;
        // console.log('added', name)
        this.packageJson.linkedProjects.push(name);
      }
    });
    if (chagned) {
      this.packageJson.writeToDiscSync();
    }
  }

  async buildLib() {
    // throw new Error("Method not implemented.");
  }


  startOnCommand() {
    return 'echo "no container support jet"'
  }

  projectSpecyficFiles(): string[] {
    return [

    ];
  }

  async buildSteps(buildOptions?: BuildOptions) {

    if (!fse.existsSync(this.location)) {
      return;
    }
    const { prod, watch, outDir, args, appBuild } = buildOptions;

    await (new SingularBuild(this)).init(watch, prod);


  }
}

//#endregion
