//#region imports
import * as _ from 'lodash';
import * as path from 'path';
import * as fse from 'fs-extra';
import { Models } from 'tnp-models';
import { Helpers, ProjectBuild } from 'tnp-helpers';
import { Project } from './project';
import chalk from 'chalk';
//#endregion



export abstract class DependencyProject {

  projectsInOrderForChainBuild(this: Project, targets: Project[] = []): Project[] {
    if (this.isContainer) {

      if (targets.length > 0) {
        let allToConsider = [];
        targets.forEach(t => {
          allToConsider = [
            t,
            ...t.projectsInOrderForChainBuild(),
            ...allToConsider,
          ];
        });
        allToConsider = Helpers.arrays.uniqArray<Project>(allToConsider, 'location');
        const reordered = reorderResult(allToConsider);
        return reordered;
      } else {
        const children = (this.children)
          .filter(f => f.frameworkVersionAtLeast('v2'))
          .map(proj => {
            return { proj, deps: proj.projectsInOrderForChainBuild() };
          });

        const allDeps = children.map(d => d.proj);
        const reordered = reorderResult(allDeps);
        return reordered;
      }

    }


    if (!this.isWorkspaceChildProject && !this.isStandaloneProject) {
      return [];
    }
    let deps: Project[] = this.sortedRequiredWorkspaceDependencies;

    if (this.isWorkspaceChildProject && this.typeIs('angular-lib') && this.workspaceDependenciesServers.length > 0) {
      deps = deps.concat(this.workspaceDependenciesServers);
      // TODO handle deps of project.workspaceDependenciesServers
    }
    if (this.isStandaloneProject) {
      deps = deps.filter(d => d.name !== this.name);
    }
    return deps;
  }


  /**
   * Only for continaer
   */
  projectsFromArgs(this: Project, args: string, argsChangeFn: (newArgs) => void): { project: Project; copyto: Project[]; }[] {
    if (!this.isContainer) {
      return [];
    }
    const indexexToCut = []
    const projects: Project[] = Helpers.arrays.uniqArray<Project>(args
      .split(' ')
      .map((arg, i) => {
        const possibleProj = path.join(this.location, arg);
        const proj = Project.From(possibleProj) as Project;
        if (proj) {
          indexexToCut.push(i);
          return proj;
        }
      })
      .filter(p => !!p), 'location');

    const newArgs = args.split(' ');
    indexexToCut.forEach(i => newArgs[i] = '');
    argsChangeFn(newArgs.join(' ').trim());

    const allProjectToConsider = Helpers.arrays.uniqArray<Project>(this.children.concat(projects),
      'location') as Project[];
    allProjectToConsider.forEach(p => {
      p.packageJson.showDeps(`updating dependencies chain container build`);
    });

    // console.log('allProjectToConsider', allProjectToConsider.map(c => c.genericName).join('\n'))

    const result = projects.map(proj => {
      let copyto = Helpers.deps.recrusiveFind(proj, allProjectToConsider);
      // proj.name.startsWith('tnp') && Helpers.log(`copyto for ${proj.genericName}

      // ${copyto.sort().map(c => c.name).join('\n')}

      // `);
      // process.stdin.resume()
      copyto = copyto.filter(c => !_.isUndefined(projects.find(a => a.name === c.name)));
      copyto = Helpers.arrays.uniqArray<Project>(copyto, 'location');
      return { project: proj, copyto }
    });
    // process.exit(0)
    return Helpers.deps.sort(result);
  }

  projectsInOrderForBuild(this: Project, buildAppsForProjects: boolean): ProjectBuild[] {
    if (!fse.existsSync(this.location)) {
      return [];
    }
    const targetClients: ProjectBuild[] = (
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
    if (!this.isWorkspaceChildProject && !this.isStandaloneProject) {
      return [];
    }
    return this.libsForTraget(this).concat([this])
  }


  libsForTraget(this: Project, project: Project) {
    if (!this.isWorkspaceChildProject && !this.isStandaloneProject) {
      return [];
    }
    return libs([{ project: project as any, appBuild: false }]).map(c => c.project);
  }


}

function libs(targetClients: ProjectBuild[], targetAsLibAlso = false) {
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
  let lastArr = [] as string[];
  result = reorderResult(result);
  // while (reorderResult(result, r => { result = r; })) {
  //   Helpers.log(`Sort(${++count})\n${result.map(c => c.genericName).join('\n')}\n `, 1);
  //   if (_.isEqual(lastArr, result.map(c => c.name))) {
  //     console.log(`EQUAL ARRAY:\n` + lastArr.map(a => '-' + a).join('\n'))
  //     break;
  //   }
  //   lastArr = result.map(c => c.name);
  // }

  if (targetAsLibAlso) {
    targetClients
      .filter(f => _.isUndefined(result.find(p => p.location === f.project.location)))
      .forEach(f => result.push(f.project as any))
  }

  return result.map(c => {
    return { project: c, appBuild: false };
  });
}


function reorderResult(result = [] as Project[]) {
  let i = 0;
  let maxNoup = 0;
  let MAX_NO_UPDATE_IN_ROW = (result.length + 1);
  let count = 1;
  while (true) {
    const res = result[i];
    const updateTriggered = !_.isUndefined(result.slice(i + 1).find((res2) => {
      if (res.name === res2.name) {
        return false;
      }
      if (!_.isUndefined(res.workspaceDependencies.find(wd => wd.name === res2.name))) {
        Helpers.log(`+ ${res.name} has no dependency ${res2.name}`, 1)
        result = Helpers.arrays.arrayMoveElementBefore<Project>(result, res2, res, 'location');
        return true;
      }
      return false;
    }));
    if (i === (result.length - 1)) {
      i = 0;
    } else {
      i++;
    }

    if (updateTriggered) {
      Helpers.log(`Sort(${++count})\n${result.map(c => c.genericName).join('\n')}\n `, 1);
      maxNoup = 0;
      continue;
    } else {
      maxNoup++;
      Helpers.log(`SORT NO UPDATE..`)
    }
    if (maxNoup === MAX_NO_UPDATE_IN_ROW) {
      break;
    }
  }

  return result;
}
