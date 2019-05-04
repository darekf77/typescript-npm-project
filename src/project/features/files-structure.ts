//#region @backend
import * as path from 'path';
import * as _ from 'lodash';
import chalk from 'chalk';

import { clearConsole, log, error, info } from '../../helpers';
import { FeatureForProject, Project } from '../abstract';
import { TnpDB } from '../../tnp-db';
import config from '../../config';
import { OutFolder } from 'morphi/build';

export type CleanType = 'all' | 'only_static_generated';
export type InitOptions = { watch: boolean; alreadyInitedPorjects?: Project[]; }

export class FilesStructure extends FeatureForProject {

  findBaselines(proj: Project, baselines: Project[] = []): Project[] {
    if (!!proj.baseline) {
      baselines.unshift(proj.baseline)
    } else {
      return baselines;
    }
    return this.findBaselines(proj.baseline)
  }

  private fixOptionsArgs(options: InitOptions) {
    if (_.isUndefined(options)) {
      options = {} as any;
    }
    if (_.isUndefined(options.alreadyInitedPorjects)) {
      options.alreadyInitedPorjects = [];
    }
    if (_.isUndefined(options.watch)) {
      options.watch = false;
    }
    return options;
  }

  public async init(args: string, options?: InitOptions) {
    options = this.fixOptionsArgs(options);
    const { alreadyInitedPorjects, watch } = options;

    const db = await TnpDB.Instance;
    await db.transaction.addProjectIfNotExist(this.project)

    if (!_.isUndefined(alreadyInitedPorjects.find(p => p.location === this.project.location))) {
      log(`Already inited project: ${chalk.bold(this.project.genericName)} - skip`);
      return;
    }
    log(`Initing project: ${chalk.bold(this.project.genericName)}`);
    alreadyInitedPorjects.push(this.project)

    if (this.project.isContainer) {

      const containerChildren = this.project.children;
      for (let index = 0; index < containerChildren.length; index++) {
        const containerChild = containerChildren[index];
        await containerChild.filesStructure.init(args, options);
      }
      return;
    }

    if (this.project.baseline) {
      await this.project.baseline.filesStructure.init(args, options);
    }

    if (this.project.isWorkspaceChildProject) {
      await this.project.parent.filesStructure.init(args, options);
    }
    console.log('alreadyInitedPorjects', alreadyInitedPorjects.map(p => p.name))
    info(`Actual initing project: ${chalk.bold(this.project.genericName)}`);

    this.project.tnpBundle.installAsPackage()
    if (!this.project.node_modules.exist) {
      await this.project.npmPackages.installAll(`initialize procedure of ${this.project.name}`);
    }
    await this.project.recreate.init();

    if (watch) {
      await this.project.join.watch()
    } else {
      await this.project.join.init()
    }

    if (!this.project.isStandaloneProject && this.project.type !== 'unknow-npm-project') {
      await this.project.env.init(args);
    }

    const sourceModifireName = `Client source modules pathes modifier`;
    const generatorName = 'Files generator: entites.ts, controllers.ts';
    if (watch) {
      await this.project.frameworkFileGenerator.initAndWatch(generatorName);
      await this.project.sourceModifier.initAndWatch(sourceModifireName);
    } else {
      await this.project.frameworkFileGenerator.init(generatorName);
      await this.project.sourceModifier.init(sourceModifireName);
    }
    info(`Init DONE for project: ${chalk.bold(this.project.genericName)}`);
  }


  private recrusiveOperation(proj: Project, recrusive = false, type: keyof Project) {
    if (type === 'clear') {
      proj.clear()
    } else if (type === 'reset') {
      proj.reset()
    }
    if (recrusive) {
      for (let index = 0; index < proj.children.length; index++) {
        const c = proj.children[index];
        this.recrusiveOperation(c, recrusive, type)
      }
    }
  }

  public async reset(options?: { recrusive: boolean; }) {
    const { recrusive = false } = options || {};
    this.recrusiveOperation(this.project, recrusive, 'reset')
  }

  public async clear(options?: { recrusive: boolean; }) {
    const { recrusive = false } = options || {};
    this.recrusiveOperation(this.project, recrusive, 'clear')
  }

  private resolveArgs(args: string) {
    let { recrusive = false, r = false } = require('minimist')(args.split(' '));
    recrusive = (recrusive || r);
    return { recrusive }
  }

  async resetFromArgs(args) {
    const { recrusive } = this.resolveArgs(args)
    await this.reset({ recrusive })
  }

  async  clearFromArgs(args) {
    const { recrusive } = this.resolveArgs(args)
    await this.clear({ recrusive })
  }

}






//#endregion
