import * as _ from 'lodash';
import chalk from 'chalk';
import * as path from 'path';
import * as fse from 'fs-extra';

import { JSON10 } from 'json10';
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
    Helpers.log(chalk.green(`Good examples:`));
    config.projectTypes.forNpmLibs.forEach(t => {
      Helpers.log(`\t${chalk.gray('tnp new')} ${chalk.black(t)} ${chalk.gray('mySuperLib')}`);
    });
    Helpers.error(chalk.red(`Please use example above.`), false, true);
  }

  private errorMsgCreateSite() {
    console.log(chalk.green(`Good examples: ${config.frameworkName} new site-project-name --basedOn baseline-workspace-project-name`));
    Helpers.error(`Please use example above.`, false, true);
  }

  private pacakgeJsonNameFix(locationDest, basedOn?: string, name?: string) {
    const pkgJSONpath = path.join(locationDest, config.file.package_json);
    const json: Models.npm.IPackageJSON = fse.readJSONSync(pkgJSONpath)
    json.name = ((name === path.basename(locationDest)) ? name : _.kebabCase(path.basename(locationDest)));

    json.tnp.isCoreProject = false;
    json.tnp.isGenerated = false;
    json.tnp.useFramework = false;
    if (basedOn) {
      json.tnp.basedOn = `./${basedOn.replace(/\/$/, '')}`;
    }

    Helpers.writeFile(pkgJSONpath, json);
  }

  public async create(
    type: Models.libs.NewFactoryType,
    name: string,
    cwd: string,
    basedOn: string,
    version: 'v1' | 'v2' = 'v1',
    skipInit = false
  ): Promise<Project> {

    const cwdProj = Project.From(cwd);
    if (cwdProj && cwdProj.isWorkspace) {
      version = cwdProj.frameworkVersion;
    }
    if (cwdProj && cwdProj.isContainer) {
      version = cwdProj.frameworkVersion;
    }

    Helpers.log(`[create] version: ${version}`);
    Helpers.log(`[create] cwdProj: ${cwdProj}`);
    Helpers.log(`[create] skip init ${skipInit}`);


    const nameKebakCase = _.kebabCase(name);
    if (nameKebakCase !== name) {
      Helpers.info(`[craete] Project name renemed to: ${nameKebakCase} `);
      name = nameKebakCase;
    }

    const basedOnProject = basedOn && Project.From(path.join(cwd, basedOn));
    if (basedOn && !basedOnProject) {
      Helpers.error(`[create] Not able to find baseline project from relative path: ${basedOn} `, false, true);
    }
    if (basedOn && basedOnProject && basedOnProject.type !== 'workspace') {
      Helpers.error(`[create] Site project only can be workspace, wrong--basedOn param: ${basedOn} `, false, true);
    }
    const baseline = basedOn ? basedOnProject : Project.by(type, version);
    Helpers.log(`[create] PROJECT BASELINE ${baseline.name} in ${baseline.location}`);

    baseline.run(`${config.frameworkName} reset && ${config.frameworkName} init`).sync();

    const destinationPath = this.getDestinationPath(name, cwd);
    Helpers.log(`[create] Destination path: ${destinationPath}`);

    if (fse.pathExistsSync(destinationPath)) {
      Helpers.info(`[create] Project "${name}" already exist in this locationzation: ${destinationPath} `);
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
          this.pacakgeJsonNameFix(destinationPath, basedOn ? basedOn : void 0, name);
          Helpers.info(`[create] project ${name} created from baseline projec ${baseline.name} success`);
          if (Project.emptyLocations.includes(destinationPath)) {
            Project.emptyLocations = Project.emptyLocations.filter(f => {
              return f !== destinationPath;
            });
            Helpers.info(`[create] Path removed from empty locations`);
          } else {
            Helpers.info(`[create] Path NOT removed from empty locations`);
          }
          if (baseline.isWorkspace) {
            const projectsConfig = [];
            baseline.children.forEach(c => {
              const generatedChildLation = path.join(destinationPath, c.name)
              c.copyManager.generateSourceCopyIn(generatedChildLation, {
                markAsGenerated: false,
              });
              if (c.type === 'angular-lib') {
                projectsConfig.push({
                  baseUrl: `/${c.name}`,
                  name: c.name,
                  port: 6000 + projectsConfig.length,
                });
              }
              if (c.type === 'isomorphic-lib') {
                projectsConfig.push({
                  baseUrl: `/api-${c.name}`,
                  name: c.name,
                  $db: {
                    database: `tmp/db-for-${c.name}.sqlite3`,
                    type: 'sqlite',
                    synchronize: true,
                    dropSchema: true,
                    logging: false
                  },
                  port: 6000 + projectsConfig.length,
                });
              }
            });

            // replace environment.js placholder
            const environmentJsFilePath = path.join(destinationPath, 'environment.js');
            let file = Helpers.readFile(environmentJsFilePath);
            const palaceHolderContent = JSON.stringify(projectsConfig, null, 2).replace(/^\[/g, '').replace(/\]$/g, '');
            file = file.replace('// <PLACEHOLDER_FOR_PROJECTS>', palaceHolderContent);
            Helpers.writeFile(environmentJsFilePath, file);
            Helpers.remove(path.join(destinationPath, config.file.tnpEnvironment_json));
          }
        } catch (err) {
          Helpers.error(`[create] Not able to create project`, false, true);
        }
      } else {
        this.errorMsgCreateProject();
      }
    }
    if (type === 'workspace') {

      const workspacePrroject = Project.From(destinationPath);
      if (basedOn) {
        workspacePrroject.baseline.children.forEach(c => {
          Helpers.log(`[craete] Basleine Child project "${c.genericName}"`);
        });
      }
      workspacePrroject.children.forEach(c => {
        Helpers.log(`[create] Child project "${c.genericName}"`);
      });
    }
    Helpers.log(`[create] destinationPath: ${destinationPath}`);
    const destProje = Project.From(destinationPath);
    if (!destProje) {
      Helpers.error(`Not able to crate project in ${destinationPath}`, false, true);
    }
    Helpers.log(`[create] Project from create method: ${destProje && destProje.genericName} `)
    if (destProje) {
      destProje.recreate.vscode.settings.excludedFiles();
      destProje.recreate.vscode.settings.colorsFromWorkspace();
      // console.log(`

      //   skip init ${skipInit}


      // `)
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
    const { basedOn, version, skipInit }: { basedOn: string; version: 'v1' | 'v2'; skipInit?: boolean } = require('minimist')(args.split(' '));


    if (basedOn) {
      Helpers.error(`To create workspace site use command: ${config.frameworkName} new: site name - of - workspace - site`
        + `--basedOn relativePathToBaselineWorkspace`, false, true);
    }
    const type = argv[0] as any;
    const name = argv[1];

    await this.create(type, name, cwd, void 0,
      (_.isString(version) && version.length <= 3 && version.startsWith('v')) ? version : void 0,
      skipInit
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
