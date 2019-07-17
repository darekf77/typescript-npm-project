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

  async buildSteps(buildOptions?: BuildOptions) {
    PROGRESS_DATA.log({ msg: 'Process started', value: 0 })
    const { prod, watch, outDir, args } = buildOptions;

    const projects = {
      angularLibs: [],
      isomorphicLibs: [],
      angularClients: [],
      angularCliClients: [],
      dockers: []
    };
    this.children.forEach(project => {
      if (project.type === 'docker') {

      } else if (project.type === 'isomorphic-lib') {
        projects.isomorphicLibs.push(project);
      } else if (project.type === 'angular-lib') {
        projects.angularLibs.push(project);
      } else if (project.type === 'angular-client') {
        projects.angularClients.push(project);
      }
    });

    _.keys(projects).forEach((key) => {
      let libsProjects = (projects[key] as Project[]);

      function order(): boolean {
        let everthingOk = true;
        libsProjects.some(p => {
          const indexProject = _.indexOf(libsProjects, p);
          p.getDepsAsProject('tnp_required_workspace_child').some(pDep => {
            const indexDependency = _.indexOf(libsProjects, pDep);
            if (indexDependency > indexProject) {
              libsProjects = ReorganizeArray(libsProjects).moveElement(pDep).before(p);
              everthingOk = false;
              return !everthingOk;
            }
          });
          return !everthingOk;
        });
        return everthingOk;
      }

      let cout = 0
      while (!order()) {
        log(`Sort(${++cout}) \n ${libsProjects.map(c => c.genericName).join('\n')}\n `);
      }
    });



    let projectsInOrder: Project[] = [
      ...projects.angularLibs,
      ...projects.isomorphicLibs,
    ];

    if (this.isGenerated) {
      projectsInOrder = projectsInOrder.concat([
        ...projects.angularClients,
        ...projects.angularCliClients,
      ]);
    }

    projectsInOrder = projectsInOrder.filter(p => {
      return !!this.env.config.workspace.projects.find(wp => wp.name === p.name);
    });


    PROGRESS_DATA.log({ value: 0, msg: `Process started` })

    log(`Projects to build in  ${this.labels.extendedBoldName} :`)
    projectsInOrder.forEach((project, i) => {
      const envProject = this.env.config.workspace.projects.find(({ name }) => name === project.name);
      log(`${i + 1}. ${project.name} ${project}  ommitAppBuild: ${envProject.ommitAppBuild}`)
    })
    log('===================')

    const projectsLibs: Project[] = projectsInOrder.filter(project => {
      return config.allowedTypes.libs.includes(project.type);
    })

    const projectsApps: Project[] = projectsInOrder
      .filter(project => {
        return config.allowedTypes.app.includes(project.type);
      })
      .filter(project => {
        const envProject = this.env.config.workspace.projects.find(({ name }) => name === project.name);
        return !envProject.ommitAppBuild
      })


    projectsLibs.forEach((project, i) => {
      log(`COMPILATIONL lib for: ${project.name}`)
    });

    projectsApps.forEach((project, i) => {
      log(`COMPILATIONL app for: ${project.name}`)
    });
    log('===================');

    const sum = 2 * (projectsLibs.length + projectsApps.length);
    let count = 1;

    const staticPrefix = this.isGenerated ? 'static:' : '';

    this.isGenerated && log(`BUILD OF PROJECT FROM: ${this.location} (((generated=${this.isGenerated}))`)

    projectsLibs.forEach((project, i) => {
      info(`START OF LIB PROJECT BUILD: ${project.name}, type: ${project.type} within ${this.labels.extendedBoldName}`);
      PROGRESS_DATA.log({ value: (count++ / sum) * 100, msg: `In progress building lib: ${project.name}` })
      project.run(`tnp ${staticPrefix}build:${outDir}${watch ? ':watch' : ''}${prod ? ':prod' : ''} --noConsoleClear ${args}`,
        { biggerBuffer: true }).sync()
      PROGRESS_DATA.log({ value: (count++ / sum) * 100, msg: `Finish building lib: ${project.name}` });
    });

    projectsApps.forEach((project) => {
      info(`START OF APP PROJECT BUILD: ${project.name}, type: ${project.type} within ${this.labels.extendedBoldName}`);
      PROGRESS_DATA.log({ value: (count++ / sum) * 100, msg: `In progress building app: ${project.name}` });
      project.run(`tnp ${staticPrefix}build:app${watch ? ':watch' : ''}${prod ? ':prod' : ''}  --noConsoleClear  ${args}`,
        { biggerBuffer: true }).sync()
      PROGRESS_DATA.log({ value: (count++ / sum) * 100, msg: `Finish building app: ${project.name}` });
    });

    PROGRESS_DATA.log({ value: 100, msg: `Process Complete` });

  }
}
//#endregion
