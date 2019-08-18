//#region @backend
import * as _ from 'lodash';
import * as glob from 'glob';
import * as fse from 'fs-extra';
// local
import { Project } from "./abstract";
import { arrayMoveElementBefore, log } from "../helpers";
import { config } from '../config';
import { info, warn } from '../helpers';
import { PROGRESS_DATA } from '../progress-output';
import { ProxyRouter } from './features/proxy-router';
import { BuildOptions } from './features/build-options';
import { ProjectBuild } from '../models';

function reorderResult(result = [], update: (result) => void): boolean {
  let neededNextOrder = false;
  result.some((res, index, arr) => {
    return !_.isUndefined(result.find((res2, index2, arr2) => {
      if (res.name === res2.name) {
        return false;
      }
      if (!_.isUndefined(res.workspaceDependencies.find(wd => wd.name === res2.name))) {
        result = arrayMoveElementBefore(result, res2, res);
        update(result);
        neededNextOrder = true;
        return true;
      }
      return false;
    }));
  });
  return neededNextOrder;
}

export class ProjectWorkspace extends Project {


  startOnCommand(args: string) {

    this.proxyRouter.activateServer((port) => {
      log(`proxy server ready on port ${port}`)
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

  private libs(targetClients: ProjectBuild[]) {
    const existed = {};
    const targetLibs = targetClients
      .map(t => t.project.workspaceDependencies)
      .reduce((a, b) => a.concat(b), [])
      .map(d => {
        if (!existed[d.name]) {
          existed[d.name] = d;
        }
        return d;
      })
      .filter(c => {
        if (existed[c.name]) {
          existed[c.name] = void 0;
          return true;
        }
        return false;
      })
      .sort((a, b) => {
        return a.workspaceDependencies.filter(c => c === b).length;
      });
    // console.log('targetClients', targetClients.map(l => l.project.genericName))
    // console.log('targetClients[0]', targetClients[0].project.workspaceDependencies.map(l => l.genericName))
    // console.log('targetClients[1]', targetClients[1].project.workspaceDependencies.map(l => l.genericName))
    // console.log('targetlibs', targetLibs.map(l => l.genericName))

    let result: Project[] = [];


    function recrusiveSearchForDependencies(lib: Project) {
      if (_.isUndefined(result.find(r => r.name === lib.name))) {
        result.push(lib);
      }
      if (lib.workspaceDependencies.length === 0) {
        return;
      }
      lib.workspaceDependencies
        .filter(f => {
          return _.isUndefined(result.find(r => r.name === f.name))
        })
        .forEach(d => {
          if (_.isUndefined(result.find(r => r.name === d.name))) {
            result.unshift(d);
          }
          recrusiveSearchForDependencies(d);
        });
    }
    targetLibs.forEach(lib => recrusiveSearchForDependencies(lib));


    let lastArr = [];
    while (reorderResult(result, r => { result = r; })) {
      // log(`Sort(${++count}) \n ${result.map(c => c.genericName).join('\n')}\n `);
      if (_.isEqual(lastArr, result.map(c => c.name))) {
        break;
      }
      lastArr = result.map(c => c.name);
    }
    return result.map(c => {
      return { project: c, appBuild: false };
    });
  }

  get projectsInOrder(): ProjectBuild[] {
    if (!fse.existsSync(this.location)) {
      return [];
    }
    const targetClients: ProjectBuild[] = (this.children.filter(p => {
      return this.env && this.env.config && !!this.env.config.workspace.projects.find(wp => wp.name === p.name);
    })).map(c => {
      return { project: c, appBuild: true };
    });

    // console.log('targetClients', targetClients.map(c => c.project.genericName))

    const libs = this.libs(targetClients);

    return [
      ...libs,
      ...(this.buildOptions && !this.buildOptions.watch ? targetClients : [])
    ];
  }


  async buildSteps(buildOptions?: BuildOptions) {
    if (!fse.existsSync(this.location)) {
      return;
    }
    PROGRESS_DATA.log({ msg: 'Process started', value: 0 });
    const { prod, watch, outDir, args } = buildOptions;
    const projects = this.projectsInOrder;
    if (this.isGenerated) {
      for (let index = 0; index < projects.length; index++) {
        const c = projects[index];
        await c.project.StaticVersion();
      }
    }
    // console.log('projects', projects.map(c => c.project.genericName))
    // process.exit(0)
    PROGRESS_DATA.log({ value: 0, msg: `Process started` });


    for (let index = 0; index < projects.length; index++) {
      const { project, appBuild } = projects[index];
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
          log(`Ommiting app build for ${this.genericName}`)
        }
      } else {
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

