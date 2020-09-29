//#region @backend
import * as _ from 'lodash';
import * as glob from 'glob';
import * as fse from 'fs-extra';
import chalk from 'chalk';
import { SingularBuild } from '../features/singular-build.backend';
import { Project } from '../abstract';
//#endregion
import { BuildOptions } from 'tnp-db';
import { Helpers } from 'tnp-helpers';
import { config } from 'tnp-config';
import { PROGRESS_DATA } from 'tnp-models';
import { CLASS } from 'typescript-class-helpers';

//#region @backend
@CLASS.NAME('ProjectWorkspace')
//#endregion
export class ProjectWorkspace
  //#region @backend
  extends Project
//#endregion
{

  async initProcedure() {
    //#region @backend
    if (this.frameworkVersionAtLeast('v2') && this.isWorkspace) {
      if (this.children.filter(c => {
        Helpers.log(`Checking child: ${c.name}`, 1)
        const isNotMatch = (c._frameworkVersion !== this._frameworkVersion);
        if (isNotMatch) {
          // TODO hmmm maybe change tnp to firedev in packagejson ?
          Helpers.error(`Please match framework in ${chalk.bold(c.name)}/package.json/>>/${config.frameworkName}/version`, true, true);
        }
        return isNotMatch;
      }).length > 0) {
        Helpers.error(`Please match framework version in workspace-v2 children`, false, true);
      }
      // checkForCircuralWorkspaceDeps(this); // TODO UNCOMMENT
    }
    //#endregion
  }

  async buildLib() { }

  startOnCommand(args: string) {
    //#region @backendFunc
    this.proxyRouter.activateServer((port) => {
      Helpers.log(`proxy server ready on port ${port}`)
    })
    const workspace: Project = this as any;
    workspace.children
      .filter(child => {
        return !!workspace.env.config.workspace.projects.find(c => {
          return c.name === child.name && !c.ommitAppBuild;
        });
      })
      .forEach(child => {
        child.start(args)
      });
    return undefined;
    //#endregion
  }

  projectSpecyficFiles(): string[] {
    //#region @backendFunc
    return [
      'environment.d.ts',
      ...this.filesTemplates(),
    ];
    //#endregion
  }

  filesTemplates() {
    //#region @backendFunc
    const templates = super.filesTemplates();
    return [
      ...this.vscodeFileTemplates,
      ...templates,
    ];
    //#endregion
  }

  projectSourceFiles() {
    //#region @backendFunc
    let environmentFiles = [];
    if (this.isSiteInStrictMode) {
      environmentFiles = environmentFiles.concat(glob
        .sync(`${config.folder.custom}/${config.file.environment}*`, { cwd: this.location }));
    } else {
      environmentFiles = environmentFiles.concat(glob
        .sync(`${config.file.environment}*`, { cwd: this.location }));
    }
    environmentFiles = environmentFiles.concat(glob
      .sync(`${config.file.tnpEnvironment_json}*`, { cwd: this.location }));

    return [
      ...(super.projectSourceFiles()),
      ...environmentFiles
    ];
    //#endregion
  }

  async buildSteps(buildOptions?: BuildOptions) {
    //#region @backendFunc
    if (!fse.existsSync(this.location)) {
      return;
    }
    PROGRESS_DATA.log({ msg: 'Process started', value: 0 });
    const { prod, watch, outDir, args, appBuild } = buildOptions;
    Helpers.log(`build opt  ${JSON.stringify({ prod, watch, outDir, args, appBuild })}`)
    const projects = this.projectsInOrderForBuild(this.isGenerated ? true : (watch));
    // console.log('project', projects.map(p => p.project.genericName))


    if (this.isGenerated) {
      for (let index = 0; index < projects.length; index++) {
        const c = projects[index] as any;
        await c.project.StaticVersion();
      }
    }
    Helpers.log(`projects: ${projects.map(c => {
      return `${c.project.genericName} appBuild: ${c.appBuild}`;
    })}`);

    if (watch) {
      await (new SingularBuild(this)).init(watch, prod);
    } else {
      PROGRESS_DATA.log({ value: 0, msg: `Process started` });
      for (let index = 0; index < projects.length; index++) {
        const { project, appBuild }: { project: Project, appBuild: boolean; } = projects[index] as any;
        const sum = projects.length;
        const precentIndex = index;

        if (appBuild) {
          if (this.isGenerated) {
            showProgress('app', project.genericName, (precentIndex / sum));
            await project.buildProcess.startForApp({
              watch,
              prod,
              args: `--noConsoleClear  ${args}`,
              staticBuildAllowed: this.isGenerated,
              progressCallback: (fraction) => {
                showProgress('app', project.genericName, ((precentIndex + fraction) / sum));
              }
            }, false);
          } else {
            Helpers.log(`Ommiting app build for ${project.genericName}`)
          }
        } else {
          // Helpers.log(`AAAA BUILD HERER`)
          showProgress('lib', project.genericName, (precentIndex / sum));
          await project.buildProcess.startForLib({
            watch,
            prod,
            args: `--noConsoleClear  ${args}`,
            staticBuildAllowed: this.isGenerated,
            progressCallback: (fraction) => {
              showProgress('lib', project.genericName, ((precentIndex + fraction) / sum));
            }
          }, false);
        }
      }
      PROGRESS_DATA.log({ value: 100, msg: `Process Complete` });
    }
    //#endregion
  }

}

//#region @backend
function showProgress(type: 'app' | 'lib', name: string, precentFraction: number) {
  PROGRESS_DATA.log({ value: (precentFraction) * 100, msg: `In progress of building ${type} "${name}"` });
}
//#endregion


//#region @backend
/**
 * TODO Replace it with topological sorting
 */
function checkForCircuralWorkspaceDeps(workspace: Project) {
  const childs = workspace.children;
  for (let index = 0; index < childs.length; index++) {
    const c = childs[index];
    const cWorkspaceDeps = c.workspaceDependencies.map(c => c.name);
    // Helpers.log(`cWorkspaceDeps:
    // ${cWorkspaceDeps.join('\n')}
    // `);
    const circural = c.workspaceDependencies.find(d => {
      const dDeps = d.workspaceDependencies.map(aa => aa.name);
      if (dDeps.includes(c.name)) {
        return true;
      }
      return false;
    });
    if (!!circural) {
      Helpers.error(`Circural dependency detected in workspace ${workspace.genericName}:

        ${circural.name} => ${c.name}
        ${c.name} => ${circural.name}

      `, false, true);
    }
  }
}
//#endregion
