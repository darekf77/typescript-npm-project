//#region @backend
import * as path from 'path';
import * as _ from 'lodash';
import chalk from 'chalk';
import * as fse from 'fs-extra';

import { clearConsole, log, error, info, tryRemoveDir } from '../../helpers';
import { FeatureForProject, Project } from '../abstract';
import { TnpDB } from '../../tnp-db';
import config from '../../config';
import { OutFolder } from 'morphi/build';
import { ProjectFactory } from '../../scripts/NEW';

export type CleanType = 'all' | 'only_static_generated';
export type InitOptions = {
  watch: boolean;
  alreadyInitedPorjects?: Project[];
  onlyJoin?: boolean;
}

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
    const { skipNodeModules, recrusive, onlyJoin }: {
      skipNodeModules: boolean; recrusive: boolean; onlyJoin?: boolean;
    } = require('minimist')(!args ? [] : args.split(' '));

    this.project.quickFixes.missingSourceFolders()
    if (this.project.isWorkspace) {
      this.project.quickFixes.badNpmPackages();
      this.project.quickFixes.missingLibs(['react-native-sqlite-storage'])
    }
    options = this.fixOptionsArgs(options);
    const { alreadyInitedPorjects, watch } = options;

    const db = await TnpDB.Instance;
    await db.transaction.addProjectIfNotExist(this.project);

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
    if (this.project.isWorkspace && this.project.isSite) {
      const recreated = this.recreateSiteChildren();
      for (let index = 0; index < recreated.length; index++) {
        const newChild = recreated[index];
        await newChild.filesStructure.init(args, options);
      }
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


    if (this.project.isWorkspaceChildProject) {
      const isInNodeMOdules = path.join(this.project.parent.location, config.folder.node_modules, this.project.name);
      if (!fse.existsSync(isInNodeMOdules)) {
        this.project.parent.workspaceSymlinks.add(`Init of workspace child project`)
      }
    }

    if (!onlyJoin) {
      this.project.tnpBundle.installAsPackage()
      if (!this.project.node_modules.exist) {
        if (skipNodeModules) {
          if (!fse.existsSync(path.join(this.project.location, config.folder.node_modules))) {
            fse.mkdirpSync(path.join(this.project.location, config.folder.node_modules));
          }
        } else {
          await this.project.npmPackages.installAll(`initialize procedure of ${this.project.name}`);
        }
      }
      await this.project.recreate.init();
    }

    if (this.project.isStandaloneProject) {
      this.project.filesTemplatesBuilder.rebuild();
    }

    if (!this.project.isStandaloneProject && this.project.type !== 'unknow-npm-project') {

      const someBuildIsActive = await db.transaction.someBuildIsActive(this.project);

      // console.log('someBuildIsActive FUCK OFFFFFFFFFFFFFF', someBuildIsActive)

      if (watch) {
        await this.project.join.initAndWatch(someBuildIsActive)

      } else {
        if (!someBuildIsActive) { // TODO
          await this.project.join.init();
        }
      }

      if (!onlyJoin) {
        await this.project.env.init(args);
        this.project.filesTemplatesBuilder.rebuild();
      }

      this.project.quickFixes.missingSourceFolders();


      if (this.project.isWorkspaceChildProject) {
        const sourceModifireName = `(${chalk.bold(this.project.genericName)})" Client source modules pathes modifier `;
        const generatorName = `(${chalk.bold(this.project.genericName)}) Files generator: entites.ts, controllers.ts`;
        if (!onlyJoin) {
          if (watch) {
            await this.project.frameworkFileGenerator.initAndWatch(generatorName);
            if (!someBuildIsActive) {
              await this.project.sourceModifier.initAndWatch(sourceModifireName);
            }
          } else {
            await this.project.frameworkFileGenerator.init(generatorName);
            if (!someBuildIsActive) {
              await this.project.sourceModifier.init(sourceModifireName);
            }
          }
        }
      }

    }


    info(`Init DONE for project: ${chalk.bold(this.project.genericName)}`);
  }

  recreateSiteChildren() {
    const newChilds: Project[] = []
    const baseline = this.project.baseline;
    baseline.children.forEach(c => {
      const siteChild = path.join(this.project.location, c.name);
      if (!fse.existsSync(siteChild)) {
        ProjectFactory.Instance.create(c.type, c.name, this.project.location);
        const newChild = Project.From(siteChild);
        c.packageJson.copyTo(newChild);
        tryRemoveDir(path.join(newChild.location, config.folder.src));
        tryRemoveDir(path.join(newChild.location, config.folder.components));
        newChild.recreate.vscode.settings.colorsFromWorkspace();
        newChilds.push(newChild);
      }
    });
    return newChilds;
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
