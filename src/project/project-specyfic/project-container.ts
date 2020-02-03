//#region @backend
import * as _ from 'lodash';
import * as path from 'path';
import { Project } from '../abstract';
import { BuildOptions } from '../features';
import { Helpers } from 'tnp-helpers';

export class ProjectContainer extends Project {


  constructor(location: string) {
    super(location);
    this.addGitReposAsLinkedProjects();
  }

  private addGitReposAsLinkedProjects() {
    console.log('this.getFolders()', this.getFolders())
    const repoChilds = this.getFolders()
      .map(c => {
        const proj = Project.From(c);
        if (!proj) {
          Helpers.info(`No project from ${c}`);
        }
        return proj;
      })
      .filter(f => !!f)
      .filter(c => c.git.isGitRepo).map(c => c.name);
    let chagned = false;
    // console.log(this.packageJson.linkedProjects.map(c => c.name))
    repoChilds.forEach(name => {
      // console.log('name', name)
      if (_.isUndefined(this.packageJson.linkedProjects.find(p => p === name))) {
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
    const { prod, watch, outDir } = buildOptions;

  }
}

//#endregion
