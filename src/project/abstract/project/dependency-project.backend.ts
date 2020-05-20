//#region imports
import * as _ from 'lodash';
import * as fse from 'fs-extra';
import { Models } from 'tnp-models';
import { Helpers } from 'tnp-helpers';
import { Project } from './project';
//#endregion

export abstract class DependencyProject {

  projectsInOrderForChainBuild(this: Project) {
    if (!this.isWorkspaceChildProject) {
      return [];
    }
    let deps: Project[] = this.sortedRequiredWorkspaceDependencies;

    if (this.typeIs('angular-lib') && this.workspaceDependenciesServers.length > 0) {
      deps = deps.concat(this.workspaceDependenciesServers);
      // TODO handle deps of project.workspaceDependenciesServers
    }
    return deps;
  }

  projectsInOrderForBuild(this: Project, buildAppsForProjects: boolean): Models.dev.ProjectBuild[] {
    if (!fse.existsSync(this.location)) {
      return [];
    }
    const targetClients: Models.dev.ProjectBuild[] = (
      this.children.filter(p => {
        return this.env && this.env.config && !!this.env.config.workspace.projects.find(wp => wp.name === p.name);
      }))
      .filter(c => c.typeIs('angular-lib'))
      .map(c => {
        return { project: c, appBuild: true };
      }) as any;

    Helpers.log(`targetClients: ${targetClients.map(c => c.project.genericName).join('\n')}`)

    const libsForTargets = libs(targetClients, true);

    targetClients.forEach(t => {
      if (_.isNil(libsForTargets.find(p => p.project.location === t.project.location))) {
        libsForTargets.push({ project: t, appBuild: false } as any);
      }
    });

    Helpers.log(`libs: ${libsForTargets.map(c => c.project.genericName).join('\n')}`)

    const aloneServers = this.children
      .filter(p => {
        return this.env && this.env.config && !!this.env.config.workspace.projects.find(wp => wp.name === p.name);
      })
      .filter(c => c.typeIs('isomorphic-lib'))
      .filter(c => _.isUndefined(libsForTargets.find(l => l.project === c)))
      .map(c => {
        return { project: c, appBuild: false };
      }) as any;

    return [
      ...libsForTargets,
      ...(this.isGenerated ? aloneServers : []),
      // ...targetClients.map(c => c.appBuild = false),
      ...(buildAppsForProjects ? targetClients : [])
    ] as any;
  }



  public get sortedRequiredWorkspaceDependencies(this: Project): Project[] {
    if (!this.isWorkspaceChildProject) {
      return [];
    }
    return this.libsForTraget(this).concat([this])
  }


  libsForTraget(this: Project, project: Project) {
    if (!this.isWorkspaceChildProject) {
      return [];
    }
    return libs([{ project: project as any, appBuild: false }]).map(c => c.project);
  }


}

function libs(targetClients: Models.dev.ProjectBuild[], targetAsLibAlso = false) {
  const existed = {};
  const targetLibs = targetClients
    .map(t => ((t.project as any) as Project).workspaceDependencies)
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

  let count = 0;
  let lastArr = [];
  while (reorderResult(result, r => { result = r; })) {
    Helpers.log(`Sort(${++count}) \n ${result.map(c => c.genericName).join('\n')}\n `, 1);
    if (_.isEqual(lastArr, result.map(c => c.name))) {
      break;
    }
    lastArr = result.map(c => c.name);
  }

  if (targetAsLibAlso) {
    targetClients
      .filter(f => _.isUndefined(result.find(p => p.location === f.project.location)))
      .forEach(f => result.push(f.project as any))
  }

  return result.map(c => {
    return { project: c, appBuild: false };
  });
}


function reorderResult(result = [], update: (result) => void): boolean {
  let neededNextOrder = false;
  result.some((res, index, arr) => {
    return !_.isUndefined(result.find((res2, index2, arr2) => {
      if (res.name === res2.name) {
        return false;
      }
      if (!_.isUndefined(res.workspaceDependencies.find(wd => wd.name === res2.name))) {
        result = Helpers.arrays.arrayMoveElementBefore(result, res2, res);
        update(result);
        neededNextOrder = true;
        return true;
      }
      return false;
    }));
  });
  return neededNextOrder;
}
