
//#region @backend
import * as _ from 'lodash';
import chalk from 'chalk';
import * as path from 'path';
import * as fse from 'fs-extra';

import config from "../config";
import { LibType } from '../models';
import { run } from "../process";
import { Project } from "../project";
import { info, error } from "../messages";

function getDestinationPath(projectName: string, cwd: string) {
  if (path.isAbsolute(projectName)) return projectName;
  return path.join(cwd, projectName);
}

function goodExamples() {
  console.log(chalk.green(`Good examples:`));
  config.libsTypes.forEach(t => {
    console.log(`\t${chalk.gray('tnp new')} ${chalk.black(t)} ${chalk.gray('mySuperLib')}`);
  })
  error(chalk.red(`Please use example above.`));
}

function pacakgeJsonNameFix(locationDest) {
  const pkgJSONpath = path.join(locationDest, config.file.package_json);
  const json = fse.readJSONSync(pkgJSONpath)
  json.name = _.kebabCase(path.basename(locationDest));
  fse.writeFileSync(pkgJSONpath, JSON.stringify(json, null, 2), 'utf8')
}

function newProject(type: LibType, name: string, cwd: string) {

  const project = Project.by(type);
  const destinationPath = getDestinationPath(name, cwd);
  if (project) {
    try {
      project.cloneTo(destinationPath);
      console.log(destinationPath)
      pacakgeJsonNameFix(destinationPath)
      info(`Project ${project.name} create successfully`);
    } catch (err) {
      error(err);
    }
  } else {
    goodExamples()
  }
}


export function NEW(args: string, exit = true, cwd = process.cwd()) {
  const argv = args.split(' ');
  if (!_.isArray(argv) || argv.length < 2) {
    error(`Top few argument for ${chalk.black('init')} parameter.`, true);
    goodExamples()
  }
  newProject(argv[0] as any, argv[1], cwd);
  if (exit) {
    process.exit(0)
  }

}


export default {
  NEW
}
//#endregion
