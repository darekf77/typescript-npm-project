
//#region @backend
import * as _ from 'lodash';
import chalk from 'chalk';
import * as path from 'path';
import * as fse from 'fs-extra';

import config from "../config";
import { LibType, IPackageJSON } from '../models';
import { run, log } from "../helpers";
import { Project } from "../project";
import { info, error } from "../helpers";


export class ProjectFactory {

  public static get create() {
    return new ProjectFactory()
  }


  private getDestinationPath(projectName: string, cwd: string) {
    if (path.isAbsolute(projectName)) {
      return projectName;
    }
    return path.join(cwd, projectName);
  }

  private errorMsgCreateProject() {
    console.log(chalk.green(`Good examples:`));
    config.libsTypes.forEach(t => {
      console.log(`\t${chalk.gray('tnp new')} ${chalk.black(t)} ${chalk.gray('mySuperLib')}`);
    })
    error(chalk.red(`Please use example above.`));
  }

  private errorMsgCreateSite() {
    console.log(chalk.green(`Good examples: tnp:new site-project-name --basedOn baseline-workspace-project-name`));
    error(`Please use example above.`, false, true);
  }

  private pacakgeJsonNameFix(locationDest, type: LibType, basedOn?: string) {
    const pkgJSONpath = path.join(locationDest, config.file.package_json);
    const json: IPackageJSON = fse.readJSONSync(pkgJSONpath)
    json.name = _.kebabCase(path.basename(locationDest));

    json.tnp.isCoreProject = false;
    json.tnp.isGenerated = false;
    if ((['isomorphic-lib', 'angular-lib'] as LibType[])) {
      json.tnp.useFramework = false;
    }
    if (basedOn) {
      json.tnp.basedOn = `./${basedOn}`;
    }

    fse.writeFileSync(pkgJSONpath, JSON.stringify(json, null, 2), 'utf8')
  }

  private start(type: LibType, name: string, cwd: string, basedOn?: string): Project {

    const nameKebakCase = _.kebabCase(name)
    if (nameKebakCase !== name) {
      info(`Project name renemed to: ${nameKebakCase}`)
    }
    name = nameKebakCase;

    const project = Project.by(type);
    const destinationPath = this.getDestinationPath(name, cwd);
    if (fse.pathExistsSync(destinationPath)) {
      info(`Project "${name}" already exist in this locationzation: ${destinationPath} `);
    } else {
      if (project) {
        try {
          project.copyManager.generateSourceCopyIn(destinationPath, {
            ommitSourceCode: global.testMode
          });
          // console.log(destinationPath)
          this.pacakgeJsonNameFix(destinationPath, type, basedOn ? basedOn : void 0)
          info(`Project ${project.name} create successfully`);
        } catch (err) {
          error(err);
        }
      } else {
        this.errorMsgCreateProject()
      }
    }
    if (type === 'workspace') {

      const w = Project.From(destinationPath);
      if (basedOn) {
        w.baseline.children.forEach(c => {
          log(`Basleine Child project "${c.genericName}"`);
        })
      }
      w.children.forEach(c => {
        log(`Child project "${c.genericName}"`);
      });
    }
    return Project.From(destinationPath);
  }


  public workspaceFromArgs(args: string, exit = true, cwd = process.cwd()) {
    const argv = args.split(' ');
    if (!_.isArray(argv) || argv.length < 2) {
      error(`Top few argument for ${chalk.black('init')} parameter.`, true);
      this.errorMsgCreateProject()
    }
    // const { basedOn }: { basedOn: string; } = require('minimist')(args.split(' '));
    const type = argv[0] as any;
    const name = argv[1]
    this.start(type, name, cwd);
    if (exit) {
      process.exit(0)
    }

  }

  public workspaceSiteFromArgs(args: string, exit = true, cwd = process.cwd()) {
    const argv = args.split(' ');
    const { basedOn }: { basedOn: string; } = require('minimist')(args.split(' '));
    if (!basedOn) {
      this.errorMsgCreateSite()
    }
    if (!Project.From(basedOn)) {
      error(`Please provide proper path to project in ${chalk.bold('--basedOn')}  parameter`);
    }
    this.start('workspace', argv[0] as any, cwd, basedOn);
    if (exit) {
      process.exit(0)
    }
  }


}



export function NEW(args: string, exit = true, cwd = process.cwd()) {
  ProjectFactory.create.workspaceFromArgs(args, exit, cwd)
}
export function NEW_SITE(args: string, exit = true, cwd = process.cwd()) {
  ProjectFactory.create.workspaceSiteFromArgs(args, exit, cwd);
}

export default {
  NEW,
  NEW_SITE
};

//#endregion
