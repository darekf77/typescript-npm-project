
//#region @backend
import * as _ from 'lodash';
import chalk from 'chalk';
import * as path from 'path';
import * as fse from 'fs-extra';

import config from "../config";
import { LibType, IPackageJSON } from '../models';
import { run } from "../helpers";
import { Project } from "../project";
import { info, error } from "../helpers";

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

function goodExamplesNewSite() {
  console.log(chalk.green(`Good examples: tnp:new site-project-name --basedOn baseline-workspace-project-name`));
  error(`Please use example above.`, false, true);
}

function pacakgeJsonNameFix(locationDest, type: LibType, basedOn?: string) {
  const pkgJSONpath = path.join(locationDest, config.file.package_json);
  const json: IPackageJSON = fse.readJSONSync(pkgJSONpath)
  json.name = _.kebabCase(path.basename(locationDest));

  json.tnp.isCoreProject = false;
  if ((['isomorphic-lib', 'angular-lib'] as LibType[])) {
    json.tnp.useFramework = false;
  }
  if (basedOn) {
    json.tnp.basedOn = basedOn;
  }

  fse.writeFileSync(pkgJSONpath, JSON.stringify(json, null, 2), 'utf8')
}

function newProject(type: LibType, name: string, cwd: string, basedOn?: string) {

  const project = Project.by(type);
  const destinationPath = getDestinationPath(name, cwd);
  if (project) {
    try {
      project.copyManager.generateSourceCopyIn(destinationPath);
      // console.log(destinationPath)
      pacakgeJsonNameFix(destinationPath, type, basedOn ? basedOn : void 0)
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
  // const { basedOn }: { basedOn: string; } = require('minimist')(args.split(' '));
  const type = argv[0] as any;
  const name = argv[1]
  newProject(type, name, cwd);
  if (exit) {
    process.exit(0)
  }

}

export function NEW_SITE(args: string, exit = true, cwd = process.cwd()) {
  const argv = args.split(' ');
  const { basedOn }: { basedOn: string; } = require('minimist')(args.split(' '));
  if (!basedOn) {
    goodExamplesNewSite()
  }
  if (!Project.From(basedOn)) {
    error(`Please provide proper path to project in ${chalk.bold('--basedOn')}  parameter`);
  }
  newProject('workspace', argv[0] as any, cwd, basedOn);
  if (exit) {
    process.exit(0)
  }
}

export default {
  NEW,
  NEW_SITE,
}
//#endregion
