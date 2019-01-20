//#region @backend
import * as _ from 'lodash';
import * as path from 'path';
import { Project, ProjectFrom } from '../project';
import { error, info } from '../messages';
import chalk from 'chalk';
import config from '../config';



function copyto(args: string) {
  let [packageName, project]: [string, (Project | string)] = args.split(' ') as any;
  if (_.isString(packageName) && packageName.trim() !== '' && _.isString(project) && project.trim() !== '') {
    if (packageName.startsWith(`${config.folder.node_modules}/`)) {
      packageName = packageName.replace(`${config.folder.node_modules}/`, '')
    }
    if (!path.isAbsolute(project)) {
      project = ProjectFrom(path.join(process.cwd(), project)) as Project;
    } else {
      project = ProjectFrom(project) as Project;
    }

    project.node_modules.copy(packageName).to(project);
    info(`Copy DONE`)
  } else {
    error(`Bad argument for ${chalk.bold('copy to module')} : "${args}"`)
  }
  process.exit(0)
}


export default {
  $copymoduletoproject: (args) => {
    copyto(args)
  },
  $copy_module_to_project: (args) => {
    copyto(args)
  }
}
//#endregion
