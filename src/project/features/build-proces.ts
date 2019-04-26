//#region @backend
import * as _ from 'lodash';
import chalk from 'chalk';

import { FeatureForProject, Project } from '../abstract';
import { BuildOptions } from './build-options';
import { BuildDir, LibType } from '../../models';
import { config } from '../../config';
import { error } from '../../helpers';
import { TnpDB } from '../../tnp-db';


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

  private async  build(buildOptions: BuildOptions, allowedLibs: LibType[], project: Project, exit = true) {

    const { watch, appBuild, args } = buildOptions;

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
      await project.init.fromArgsAndWatch(args);
    } else {
      await project.init.fromArgs(args);
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
