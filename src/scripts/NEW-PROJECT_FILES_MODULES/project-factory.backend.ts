import * as _ from 'lodash';
import chalk from 'chalk';
import * as path from 'path';
import * as fse from 'fs-extra';

import { config } from '../../config';
import { Models } from 'tnp-models';
import { Helpers } from 'tnp-helpers';
import { Project } from '../../project';

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
    config.projectTypes.forNpmLibs.forEach(t => {
      console.log(`\t${chalk.gray('tnp new')} ${chalk.black(t)} ${chalk.gray('mySuperLib')}`);
    })
    Helpers.error(chalk.red(`Please use example above.`), false, true);
  }

  private errorMsgCreateSite() {
    console.log(chalk.green(`Good examples: ${config.frameworkName} new site-project-name --basedOn baseline-workspace-project-name`));
    Helpers.error(`Please use example above.`, false, true);
  }

  private pacakgeJsonNameFix(locationDest, basedOn?: string) {
    const pkgJSONpath = path.join(locationDest, config.file.package_json);
    const json: Models.npm.IPackageJSON = fse.readJSONSync(pkgJSONpath)
    json.name = _.kebabCase(path.basename(locationDest));

    json.tnp.isCoreProject = false;
    json.tnp.isGenerated = false;
    json.tnp.useFramework = false;
    if (basedOn) {
      json.tnp.basedOn = `./${basedOn.replace(/\/$/, '')}`;
    }

    Helpers.writeFile(pkgJSONpath, json);
  }

  public async create(type: Models.libs.NewFactoryType, name: string, cwd: string, basedOn: string, version: 'v1' | 'v2' = 'v1', skipInit = false): Promise<Project> {
    const cwdProj = Project.From(cwd);
    if (cwdProj && cwdProj.isWorkspace) {
      version = cwdProj.frameworkVersion;
    }

    console.log('version', version)
    // process.exit(0)

    const nameKebakCase = _.kebabCase(name)
    if (nameKebakCase !== name) {
      Helpers.info(`Project name renemed to: ${nameKebakCase} `)
    }
    name = nameKebakCase;
    const basedOnProject = basedOn && Project.From(path.join(cwd, basedOn));
    if (basedOn && !basedOnProject) {
      Helpers.error(`Not able to find baseline project from relative path: ${basedOn} `, false, true);
    }
    if (basedOn && basedOnProject && basedOnProject.type !== 'workspace') {
      Helpers.error(`Site project only can be workspace, wrong--basedOn param: ${basedOn} `, false, true);
    }
    const baseline = basedOn ? basedOnProject : Project.by(type, version);
    Helpers.log(`PROJECT BASELINE ${baseline.name} in ${baseline.location}`);
    baseline.run(`${config.frameworkName} init`).sync();

    const destinationPath = this.getDestinationPath(name, cwd);
    Helpers.log(`Destination path: ${destinationPath}`);

    if (fse.pathExistsSync(destinationPath)) {
      Helpers.info(`Project "${name}" already exist in this locationzation: ${destinationPath} `);
    } else {
      if (baseline) {
        try {
          baseline.copyManager.generateSourceCopyIn(destinationPath, {
            // ommitSourceCode: global.testMode,
            regenerateOnlyCoreProjects: !basedOn,
            markAsGenerated: false,
            regenerateProjectChilds: true,
            forceCopyPackageJSON: type === 'single-file-project'
          });
          // console.log(destinationPath)
          this.pacakgeJsonNameFix(destinationPath, basedOn ? basedOn : void 0);
          Helpers.info(`Project ${baseline.name} create successfully`);
        } catch (err) {
          Helpers.error(err);
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
    const destProje = Project.From(destinationPath);
    if (destProje) {
      destProje.recreate.vscode.settings.excludedFiles();
      destProje.recreate.vscode.settings.colorsFromWorkspace()
      if (!skipInit) {
        await destProje.filesStructure.init('')
      }
    }
    return destProje;
  }


  public createModelFromArgs(args: string, exit = true, cwd: string) {
    const argv = args.split(' ');
    const name = argv[1]
    const relativePath = argv[2]
    Project.From(cwd).filesFactory.createModel(relativePath, name);
    if (exit) {
      process.exit(0)
    }
  }

  public async workspaceFromArgs(args: string, exit = true, cwd: string) {
    const argv = args.split(' ');

    if (!_.isArray(argv) || argv.length < 2) {
      Helpers.error(`Top few argument for ${chalk.black('init')} parameter.`, true);
      this.errorMsgCreateProject()
    }
    const { basedOn, version }: { basedOn: string; version: 'v1' | 'v2'; } = require('minimist')(args.split(' '));


    if (basedOn) {
      Helpers.error(`To create workspace site use command: ${config.frameworkName} new: site name - of - workspace - site`
        + `--basedOn relativePathToBaselineWorkspace`, false, true);
    }
    const type = argv[0] as any;
    const name = argv[1];

    await this.create(type, name, cwd, void 0,
      (_.isString(version) && version.length <= 3 && version.startsWith('v')) ? version : void 0
    );
    if (exit) {
      process.exit(0)
    }

  }

  public async workspaceSiteFromArgs(args: string, exit = true, cwd: string) {
    const argv = args.split(' ');
    const { basedOn }: { basedOn: string; } = require('minimist')(args.split(' '));
    if (!basedOn) {
      this.errorMsgCreateSite()
    }
    await this.create('workspace', argv[0] as any, cwd, basedOn);
    if (exit) {
      process.exit(0)
    }
  }


}
