//#region @backend
import * as _ from 'lodash';
import * as glob from 'glob';
import * as fse from 'fs-extra';
import chalk from 'chalk';
// local
import { Project } from '../abstract';
import { Helpers } from 'tnp-helpers';
import { config } from '../../config';
import { PROGRESS_DATA } from '../../progress-output';
import { ProxyRouter } from '../features/proxy-router';
import { BuildOptions } from '../features';
import { Models } from 'tnp-models';


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

export class ProjectWorkspace extends Project {


  constructor(public location: string) {
    super(location);
    if (this.frameworkVersion === 'v2' && this.isWorkspace) {
      if (this.children.filter(c => {
        // Helpers.log(`Checking child: ${c.name}`)
        const isNotMatch = (c.frameworkVersion !== this.frameworkVersion);
        if (isNotMatch) {
          Helpers.error(`Please match framework in ${chalk.bold(c.name)}/package.json/tnp/version`, true, true);
        }
        return isNotMatch;
      }).length > 0) {
        Helpers.error(`Please match framework version in workspace-v2 children`, false, true);
      }
      checkForCircuralWorkspaceDeps(this);
    }
  }
  async buildLib() {
    // throw new Error("Method not implemented.");
  }


  startOnCommand(args: string) {

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
  }
  projectSpecyficFiles(): string[] {
    return ['environment.d.ts'];
  }

  projectSourceFiles() {
    let environmentFiles = [];
    if (this.isSite) {
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
  }

  get projectsInOrder(): Models.dev.ProjectBuild[] {
    if (!fse.existsSync(this.location)) {
      return [];
    }
    const targetClients: Models.dev.ProjectBuild[] = (
      this.children.filter(p => {
        return this.env && this.env.config && !!this.env.config.workspace.projects.find(wp => wp.name === p.name);
      }))
      .map(c => {
        return { project: c, appBuild: true };
      }) as any;

    // console.log('targetClients', targetClients.map(c => c.project.genericName))

    const libs = this.libs(targetClients);

    return [
      ...libs,
      ...(this.buildOptions && !this.buildOptions.watch ? targetClients : [])
    ] as any;
  }


  async buildSteps(buildOptions?: BuildOptions) {


    if (!fse.existsSync(this.location)) {
      return;
    }
    PROGRESS_DATA.log({ msg: 'Process started', value: 0 });
    const { prod, watch, outDir, args, appBuild } = buildOptions;
    Helpers.log(`build opt  ${JSON.stringify({ prod, watch, outDir, args, appBuild })}`)
    const projects = this.projectsInOrder.map(p => {
      p.appBuild = this.isGenerated;
      return p;
    })
    console.log('project', projects.map(p => p.project.genericName))
    // @LAST
    process.exit(0)
    if (this.isGenerated) {
      for (let index = 0; index < projects.length; index++) {
        const c = projects[index] as any;
        await c.project.StaticVersion();
      }
    }
    // console.log('projects', projects.map(c => c.project.genericName))
    // process.exit(0)
    PROGRESS_DATA.log({ value: 0, msg: `Process started` });

    // console.log('project length', projects.length)
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
}

function showProgress(type: 'app' | 'lib', name: string, precentFraction: number) {
  PROGRESS_DATA.log({ value: (precentFraction) * 100, msg: `In progress of building ${type} "${name}"` });
}


//#endregion
