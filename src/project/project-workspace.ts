//#region @backend
import * as _ from 'lodash';
// local
import { Project } from "./abstract";
import { ReorganizeArray, log } from "../helpers";
import { config } from '../config';
import { info, warn } from '../helpers';
import { PROGRESS_DATA } from '../progress-output';
import { ProxyRouter } from './features/proxy-router';
import { BuildOptions } from './features/build-options';
import { ProjectBuild } from '../models';


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

  private libs(targetClients: ProjectBuild[]) {
    const existed = {};
    const targetLibs = targetClients
      .map(t => t.project.workspaceDependencies)
      .reduce((a, b) => a.concat(b))
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

    function order(): boolean {
      let neededNextOrder = false;
      result.some((res, index, arr) => {
        return result.find((res2, index2, arr2) => {
          if (res.name === res2.name) {
            return false;
          }
          if (!_.isUndefined(res.workspaceDependencies.find(wd => wd.name === res2.name))) {
            result = ReorganizeArray(result).moveElement(res2).before(res);
            neededNextOrder = true;
            return true;
          }
          return false;
        });
      });
      return neededNextOrder;
    }

    let count = 0;
    let lastArr = [];
    while (order()) {
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
    const targetClients: ProjectBuild[] = (this.isGenerated ? this.children.filter(p => {
      return !!this.env.config.workspace.projects.find(wp => wp.name === p.name);
    }) : this.childrenThatAreClients).map(c => {
      return { project: c, appBuild: true };
    });

    const libs = this.libs(targetClients);

    return [
      ...libs,
      ...targetClients
    ];
  }

  async buildSteps(buildOptions?: BuildOptions) {
    PROGRESS_DATA.log({ msg: 'Process started', value: 0 })
    const { prod, watch, outDir, args } = buildOptions;
    const projects = this.projectsInOrder;
    if (this.isGenerated) {
      projects.forEach(c => {
        c.project = c.project.StaticVersion;
      });
    }

    PROGRESS_DATA.log({ value: 0, msg: `Process started` });


    let count = 1;
    for (let index = 0; index < projects.length; index++) {
      const { project, appBuild } = projects[index];
      const sum = projects.length;
      if (appBuild) {
        PROGRESS_DATA.log({ value: (count++ / sum) * 100, msg: `In progress building app: ${project.genericName}` });

        await project.buildProcess.startForApp({
          watch,
          prod,
          args: `--noConsoleClear  ${args}`,
          staticBuildAllowed: this.isGenerated
        }, false1);

        PROGRESS_DATA.log({ value: (count++ / sum) * 100, msg: `Finish building app: ${project.genericName}` });
      } else {
        PROGRESS_DATA.log({ value: (count++ / sum) * 100, msg: `In progress building lib: ${project.genericName}` })

        await project.buildProcess.startForLib({
          watch,
          prod,
          args: `--noConsoleClear  ${args}`,
          staticBuildAllowed: this.isGenerated
        }, false);

        PROGRESS_DATA.log({ value: (count++ / sum) * 100, msg: `Finish building lib: ${project.genericName}` });
      }
    }
    PROGRESS_DATA.log({ value: 100, msg: `Process Complete` });
  }
}
//#endregion
