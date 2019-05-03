//#region @backend
import * as path from 'path';
import * as _ from 'lodash';
import chalk from 'chalk';

import { clearConsole, log, error, info } from '../../helpers';
import { FeatureForProject, Project } from '../abstract';
import { TnpDB } from '../../tnp-db';
import config from '../../config';
import { OutFolder } from 'morphi/build';

export type CleanType = 'all' | 'only_static_generated'

export class FilesStructure extends FeatureForProject {

  findBaselines(proj: Project, baselines: Project[] = []): Project[] {
    if (!!proj.baseline) {
      baselines.unshift(proj.baseline)
    } else {
      return baselines;
    }
    return this.findBaselines(proj.baseline)
  }

  public async init(args: string, options?: { watch: boolean; alreadyInitedPorjects?: Project[] }) {
    const { watch = false, alreadyInitedPorjects = [] } = options || {};

    const db = await TnpDB.Instance;
    await db.transaction.addProjectIfNotExist(this.project)

    if (!_.isUndefined(alreadyInitedPorjects.find(p => p.location === this.project.location))) {
      return;
    }
    info(`Initing project: ${chalk.bold(this.project.genericName)}`);
    alreadyInitedPorjects.push(this.project)

    if (this.project.isContainer) {
      const containerChildren = this.project.children;
      for (let index = 0; index < containerChildren.length; index++) {
        const containerChild = containerChildren[index];
        await containerChild.filesStructure.init(args, options);
      }
      return;
    }

    if (this.project.isWorkspaceChildProject) {
      await this.project.parent.filesStructure.init(args, _.merge(options));
    }

    if (this.project.baseline) {
      await this.project.baseline.filesStructure.init(args, options);
    }

    this.project.tnpBundle.installAsPackage()
    await this.project.npmPackages.installAll(`initialize procedure of ${this.project.name}`);
    await this.project.recreate.init();

    const sourceModifireName = `Client source modules pathes modifier`;
    const generatorName = 'Files generator: entites.ts, controllers.ts';
    if (watch) {
      if (this.project.type === 'isomorphic-lib') {
        await this.project.frameworkFileGenerator.initAndWatch(generatorName)
      } else {
        await this.project.sourceModifier.initAndWatch(sourceModifireName)
      }
    } else {
      if (this.project.type === 'isomorphic-lib') {
        await this.project.frameworkFileGenerator.init(generatorName)
      } else {
        await this.project.sourceModifier.init(sourceModifireName)
      }
    }

    if (!this.project.isStandaloneProject && this.project.type !== 'unknow-npm-project') {
      const initFromScratch = (!this.project.env.config ||
        (this.project.isWorkspaceChildProject && !this.project.parent.env.config));
      await this.project.env.init(args, !initFromScratch);

      if (!initFromScratch) {
        log(`Config alredy ${chalk.bold('init')}ed tnp.
  ${chalk.green('Environment for')} ${this.project.isGenerated ? chalk.bold('(generated)') : ''} `
          + `${chalk.green(chalk.bold(this.project.genericName))}: ${chalk.bold(this.project.env.config.name)}`)
      }

    }
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
