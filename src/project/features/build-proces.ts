//#region @backend
import * as _ from 'lodash';
import chalk from 'chalk';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as glob from 'glob';

import { FeatureForProject, Project } from '../abstract';
import { BuildOptions } from './build-options';
import { BuildDir, LibType } from '../../models';
import { config } from '../../config';
import { error } from '../../helpers';
import { TnpDB } from '../../tnp-db';
import { PROGRESS_DATA } from '../../progress-output';


export class BuildProcess extends FeatureForProject {

  async  startForLib(prod = false, watch = false, outDir: BuildDir,
    args: string, overrideOptions: BuildOptions = {} as any) {

    const project: Project = Project.Current;
    const options: BuildOptions = BuildOptions.from(args, project, { outDir, watch, prod, appBuild: false, args });
    await this.build(_.merge(options, overrideOptions), config.allowedTypes.libs, project)
  }


  async  startForApp(prod = false, watch = false, outDir: BuildDir = 'dist',
    args: string, overrideOptions: BuildOptions = {} as any) {
    const project: Project = Project.Current;
    const options: BuildOptions = BuildOptions.from(args, project, { outDir, watch, prod, appBuild: true, args });
    await this.build(_.merge(options, overrideOptions), config.allowedTypes.app, project);
  }

  private mergeNpmPorject() {
    // console.log(this.project.parent.getAllChildren({ unknowIncluded: true }))
    if (this.project.isWorkspaceChildProject) {
      this.project.parent.getFolders()
        .filter(p => !this.project.parent.children.map(c => c.name).includes(path.basename(p)))
        .forEach(p => {
          const moduleInNodeModules = path.join(this.project.parent.location, config.folder.node_modules, path.basename(p));
          const moduleAsChild = path.join(this.project.parent.location, path.basename(p));

          if (fse.existsSync(moduleInNodeModules)) {
            let files = glob.sync(`${moduleAsChild}/**/*.*`);
            files = files.map(f => f.replace(moduleAsChild, ''))
            files.forEach(f => {

              const inNodeM = path.join(moduleInNodeModules, f);
              const newToReplace = path.join(moduleAsChild, f);
              if (fse.existsSync(inNodeM)) {
                if (!fse.existsSync(`${inNodeM}.orginalFile`)) {
                  fse.copyFileSync(inNodeM, `${inNodeM}.orginalFile`)
                }
                fse.copyFileSync(newToReplace, inNodeM);
              }
            });
          }
        })
    }

  }

  private get checkIfGeneratedTnpBundle() {
    return Project.Current.isTnp ? true : fse.existsSync(path.join(Project.Tnp.location, global.tnp_out_folder, config.folder.browser))
  }

  private async  build(buildOptions: BuildOptions, allowedLibs: LibType[], project: Project, exit = true) {

    if (!this.checkIfGeneratedTnpBundle) {
      error(`Please compile your tsc-npm-project to tnp-bundle`, false, true)
    }

    this.mergeNpmPorject()

    const { watch, appBuild, args } = buildOptions;

    if(!watch) {
      PROGRESS_DATA.log({ value: 0, msg: `Static build initing` })
    }

    if (_.isArray(allowedLibs) && !allowedLibs.includes(project.type)) {
      if (appBuild) {
        error(`App build only for tnp ${chalk.bold(allowedLibs.join(','))} project types`, false, true)
      } else {
        error(`Library build only for tnp ${chalk.bold(allowedLibs.join(','))} project types`, false, true)
      }
    }

    const transactions = (await (await TnpDB.Instance).transaction);
    await transactions.updateBuildsWithCurrent(project, buildOptions, process.pid, true)

    if (watch) {
      await project.filesStructure.init(args, { watch: true });
    } else {
      await project.filesStructure.init(args);
    }

    project = await project.staticBuild.resolveProjectIfGenerated(buildOptions, args)

    await transactions.updateBuildsWithCurrent(project, buildOptions, process.pid, false)


    await project.build(buildOptions);
    if (exit && !watch) {
      process.exit(0)
    }

  }


}

//#endregion
