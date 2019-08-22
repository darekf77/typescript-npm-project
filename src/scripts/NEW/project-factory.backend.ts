
import * as _ from 'lodash';
import chalk from 'chalk';
import * as path from 'path';
import * as fse from 'fs-extra';

import config from '../../config';
import { LibType, IPackageJSON, NewFactoryType } from '../../models';
import { run, log } from '../../helpers';
import { Project } from '../../project';
import { info, error } from '../../helpers';


export class ProjectFactory {

  private static _instance: ProjectFactory;
  public static get Instance() {
    if (!this._instance) {
      this._instance = new ProjectFactory();
    }
    return this._instance;
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
    error(chalk.red(`Please use example above.`), false, true);
  }

  private errorMsgCreateSite() {
    console.log(chalk.green(`Good examples: tnp new site-project-name --basedOn baseline-workspace-project-name`));
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
      json.tnp.basedOn = `./${basedOn.replace(/\/$/, '')}`;
    }

    fse.writeFileSync(pkgJSONpath, JSON.stringify(json, null, 2), 'utf8')
  }

  public create(type: LibType, name: string, cwd: string, basedOn?: string): Project {

    const nameKebakCase = _.kebabCase(name)
    if (nameKebakCase !== name) {
      info(`Project name renemed to: ${nameKebakCase} `)
    }
    name = nameKebakCase;
    const basedOnProject = basedOn && Project.From(path.join(cwd, basedOn));
    if (basedOn && !basedOnProject) {
      error(`Not able to find baseline project from relative path: ${basedOn} `, false, true);
    }
    if (basedOn && basedOnProject && basedOnProject.type !== 'workspace') {
      error(`Site project only can be workspace, wrong--basedOn param: ${basedOn} `, false, true);
    }
    const baseline = basedOn ? basedOnProject : Project.by(type);
    console.log('PROJECt BASELINE', baseline.location);
    const destinationPath = this.getDestinationPath(name, cwd);
    if (fse.pathExistsSync(destinationPath)) {
      info(`Project "${name}" already exist in this locationzation: ${destinationPath} `);
    } else {
      if (baseline) {
        try {
          baseline.copyManager.generateSourceCopyIn(destinationPath, {
            // ommitSourceCode: global.testMode,
            regenerateOnlyCoreProjects: !basedOn,
            markAsGenerated: false,
            regenerateProjectChilds: true,
          });
          // console.log(destinationPath)
          this.pacakgeJsonNameFix(destinationPath, type, basedOn ? basedOn : void 0)
          info(`Project ${baseline.name} create successfully`);
        } catch (err) {
          error(err);
        }
      } else {
        this.errorMsgCreateProject()
      }
    }
    if (type === 'workspace') {

      const workspacePrroject = Project.From(destinationPath);
      if (basedOn) {
        workspacePrroject.baseline.children.forEach(c => {
          // log(`Basleine Child project "${c.genericName}"`);
        });
      }
      workspacePrroject.children.forEach(c => {
        // log(`Child project "${c.genericName}"`);
      });
    }
    return Project.From(destinationPath);
  }

  public createModelFromArgs(args: string, exit = true, cwd = process.cwd()) {
    const argv = args.split(' ');
    const name = argv[1]
    const relativePath = argv[2]
    Project.From(cwd).filesFactory.createModel(relativePath, name);
    if (exit) {
      process.exit(0)
    }
  }

  public workspaceFromArgs(args: string, exit = true, cwd = process.cwd()) {
    const argv = args.split(' ');

    if (!_.isArray(argv) || argv.length < 2) {
      error(`Top few argument for ${chalk.black('init')} parameter.`, true);
      this.errorMsgCreateProject()
    }
    const { basedOn }: { basedOn: string; } = require('minimist')(args.split(' '));

    if (basedOn) {
      error(`To create workspace site use command: tnp new: site name - of - workspace - site`
        + `--basedOn relativePathToBaselineWorkspace`, false, true);
    }
    const type = argv[0] as any;
    const name = argv[1]
    this.create(type, name, cwd);
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
    this.create('workspace', argv[0] as any, cwd, basedOn);
    if (exit) {
      process.exit(0)
    }
  }


}


