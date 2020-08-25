//#region imports
import * as _ from 'lodash';
import * as path from 'path';
import * as fse from 'fs-extra';
import { Models } from 'tnp-models';
import { Helpers, ProjectBuild } from 'tnp-helpers';
import { Project } from './project';
import chalk from 'chalk';
//#endregion


function recrusiveFindDependencies(currentProj: Project, allAvailableProjects: Project[], deps: Project[] = [], orgProj?: Project) {
  if (!orgProj) {
    orgProj = currentProj;
  }
  const availableDeps = allAvailableProjects
    .filter(p => !deps.includes(p))
    ;

  const depsToAppend = availableDeps.filter(p => {
    const res = p.packageJson.hasDependency(currentProj.name, true);
    // if (res) {
    //   Helpers.log(`${chalk.bold(orgProj.name + '/' + currentProj.name)} ${p.name} has dependency ${currentProj.name}`);
    // }
    return res;
  })

  depsToAppend.forEach(p => deps.push(p));
  // console.log(`after appending deps ${chalk.bold(orgProj.name + '/' + currentProj.name)}`
  //   , deps.map(d => chalk.gray(d.name)).join(','))

  depsToAppend.forEach(p => {
    recrusiveFindDependencies(p, allAvailableProjects, deps, orgProj);
  });
  return deps;
}

function sortDependencies(deps: { project: Project; copyto: Project[] }[]) {
  // return deps;
  let last_currentProjIndex: number;
  let last_indexToReplace: number;
  while (true) {
    const depsProjs = deps.map(p => p.project);
    // Helpers.log('\n' + depsProjs.map((p, i) => `${i}. ${p.name}`).join('\n') + '\n', 1)
    let continueAgain = false;
    for (let currentProjIndex = 0; currentProjIndex < deps.length; currentProjIndex++) {
      // const proj = deps[currentProjIndex].project;
      // const copyto = deps[currentProjIndex].copyto;

      const copytoIndexes = deps[currentProjIndex].copyto
        .filter(p => p.location !== deps[currentProjIndex].project.location)
        .map(p => depsProjs.indexOf(p));
      const indexToReplace = copytoIndexes.filter(i => i !== currentProjIndex).find(i => {
        const result = i < currentProjIndex;
        Helpers.log(`${deps[i].project.name} index is less than project ${deps[currentProjIndex].project.name}`, 1)
        return result;
      });
      if (_.isNumber(indexToReplace)) {
        const v1 = deps[currentProjIndex];
        const v2 = deps[indexToReplace];
        if (v1.copyto.includes(v2.project) && (v2.copyto.includes(v1.project))) {
          Helpers.warn(`Circural copyto between ${chalk.bold(v1.project.name)}(${currentProjIndex}) `
            + ` and ${chalk.bold(v2.project.name)}(${indexToReplace})`)
        } else {
          // if (last_currentProjIndex === currentProjIndex && last_indexToReplace === indexToReplace) {
          //   Helpers.warn(`Weird circural copyto between ${chalk.bold(v1.project.name)}(${currentProjIndex}) `
          //     + ` and ${chalk.bold(v2.project.name)}(${indexToReplace})`)
          // } else {
          continueAgain = true;
          // Helpers.log(`${v1.project.name}(${currentProjIndex}) should be swapped with ${v2.project.name}(${indexToReplace})`, 1);
          deps[currentProjIndex] = v2;
          deps[indexToReplace] = v1;
          last_currentProjIndex = currentProjIndex;
          last_indexToReplace = indexToReplace;
          break;
          // }
        }

      }
    }
    if (continueAgain) {
      continue;
    }
    break;
  }

  const onlyWithZeros = deps.filter(c => c.copyto.length === 0);
  const onlyNormal = deps.filter(c => c.copyto.length > 0);
  onlyNormal.forEach(d => {
    onlyWithZeros.forEach(b => {
      if (!d.copyto.includes(b.project)) {
        d.copyto.push(b.project);
      }
    });
  });
  deps = [
    ...onlyNormal,
    ...onlyWithZeros,
  ];
  return deps;
}

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
      let copyto = recrusiveFindDependencies(proj, allProjectToConsider);
      // proj.name.startsWith('tnp') && Helpers.log(`copyto for ${proj.genericName}

      // ${copyto.sort().map(c => c.name).join('\n')}

      // `);
      // process.stdin.resume()
      copyto = copyto.filter(c => !_.isUndefined(projects.find(a => a.name === c.name)));
      copyto = Helpers.arrays.uniqArray<Project>(copyto, 'location');
      return { project: proj, copyto }
    });
    // process.exit(0)
    return sortDependencies(result)
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
