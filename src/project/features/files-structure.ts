//#region @backend
import * as path from 'path';
import * as _ from 'lodash';
import chalk from 'chalk';
import * as fse from 'fs-extra';

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
    const { skipNodeModules, recrusive }: {
      skipNodeModules: boolean; recrusive: boolean;
    } = require('minimist')(!args ? [] : args.split(' '));

    this.project.quickFixMissingSourceFolders()
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
        for (let indexChild = 0; indexChild < containerChild.children.length; indexChild++) {
          const workspaceChild = containerChild.children[indexChild];
          await workspaceChild.filesStructure.init(args, options)
        }
      }
      return;
    }
    if (this.project.isWorkspace && recrusive) {
      const workspaceChildren = this.project.children;
      for (let index = 0; index < workspaceChildren.length; index++) {
        const workspaceChild = workspaceChildren[index];
        await workspaceChild.filesStructure.init(args, options);
      }
    }

    if (this.project.baseline) {
      await this.project.baseline.filesStructure.init(args, options);
    }

    if (this.project.isWorkspaceChildProject) {
      await this.project.parent.filesStructure.init(args, options);
    }
    // console.log('alreadyInitedPorjects', alreadyInitedPorjects.map(p => p.name))
    info(`Actual initing project: ${chalk.bold(this.project.genericName)}`);

    this.project.tnpBundle.installAsPackage()
    if (!this.project.node_modules.exist) {
      if (skipNodeModules) {
        if (!path.join(this.project.location, config.folder.node_modules)) {
          fse.mkdirpSync(path.join(this.project.location, config.folder.node_modules));
        }
      } else {
        await this.project.npmPackages.installAll(`initialize procedure of ${this.project.name}`);
      }
    }
    await this.project.recreate.init();

    if (!this.project.isStandaloneProject && this.project.type !== 'unknow-npm-project') {

      if (watch) {
        await this.project.join.initAndWatch()
      } else {
        await this.project.join.init()
      }

      await this.project.env.init(args);
      this.project.quickFixMissingSourceFolders()
      const sourceModifireName = `(${chalk.bold(this.project.genericName)})" Client source modules pathes modifier `;
      const generatorName = `(${chalk.bold(this.project.genericName)}) Files generator: entites.ts, controllers.ts`;

      if (watch) {
        await this.project.frameworkFileGenerator.initAndWatch(generatorName);
        await this.project.sourceModifier.initAndWatch(sourceModifireName);
      } else {
        await this.project.frameworkFileGenerator.init(generatorName);
        await this.project.sourceModifier.init(sourceModifireName);
      }
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
