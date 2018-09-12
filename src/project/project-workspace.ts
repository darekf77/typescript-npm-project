import * as _ from 'lodash';
// local
import { Project } from "./base-project";
import { BuildOptions } from "../models";
import { ReorganizeArray } from "../helpers";
import { config } from '../config';
import { info } from '../messages';


export class ProjectWorkspace extends Project {

  startOnCommand() {

    // console.log('this.routes', this.routes.map(r => r.name))
    this.proxyRouter.activateServer()
    const workspace: Project = this as any;
    workspace.children
      .filter(child => {
        return !!workspace.env.workspaceConfig.workspace.projects.find(c => c.name === child.name);
      })
      .forEach(child => {
        child.start()
      });
    return 'echo "Workspace server started"';
  }
  projectSpecyficFiles(): string[] {
    return [];
  }

  buildSteps(buildOptions?: BuildOptions) {

    const { environmentName, prod, watch, outDir } = buildOptions;

    const projects = {
      serverLibs: [],
      isomorphicLibs: [],
      angularLibs: [],
      angularClients: [],
      angularCliClients: [],
      dockers: []
    };
    this.children.forEach(project => {
      if (project.type === 'docker') projects.dockers.push(project);
      else if (project.type === 'server-lib') projects.serverLibs.push(project);
      else if (project.type === 'isomorphic-lib') projects.isomorphicLibs.push(project);
      else if (project.type === 'angular-lib') projects.angularLibs.push(project);
      else if (project.type === 'angular-client') projects.angularClients.push(project);
      else if (project.type === 'angular-cli') projects.angularCliClients.push(project);
    })


    _.keys(projects).forEach((key) => {
      let libsProjects = (projects[key] as Project[]);

      function order(): boolean {
        let everthingOk = true;
        libsProjects.some(p => {
          const indexProject = _.indexOf(libsProjects, p);
          p.requiredLibs.some(pDep => {
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
        console.log(`Sort(${++cout})`, libsProjects);
      }
    });



    const projectsInOrder: Project[] = [
      ...projects.serverLibs,
      ...projects.isomorphicLibs,
      ...projects.angularLibs,
      ...projects.angularClients,
      ...projects.angularCliClients
    ].filter(p => {
      return !!this.env.workspaceConfig.workspace.projects.find(wp => wp.name === p.name)
    });

    console.log(`[[[${JSON.stringify({ value: 0, info: `Process started`, status: 'inprogress' })}]]]`)

    console.log('Projects to build:')
    projectsInOrder.forEach((project, i) => {
      console.log(`${i + 1}. ${project.name}`)
    })
    console.log('===================')

    const projectsLibs: Project[] = projectsInOrder.filter(project => {
      return config.allowedTypes.libs.includes(project.type);
    })

    const projectsApps: Project[] = projectsInOrder.filter(project => {
      return config.allowedTypes.app.includes(project.type);
    })

    projectsLibs.forEach((project, i) => {
      console.log(`COMPILATIONL lib for: ${project.name}`)
    });

    projectsApps.forEach((project, i) => {
      console.log(`COMPILATIONL app for: ${project.name}`)
    });
    console.log('===================')

    const sum = projectsLibs.length + projectsApps.length;
    let count = 1;



    projectsLibs.forEach((project, i) => {
      info(`START OF LIB PROJECT BUILD: ${project.name}, type: ${project.type}`);
      console.log(`[[[${JSON.stringify({ value: (count++ / sum) * 100, info: `In progress building lib: ${project.name}`, status: 'inprogress' })}]]]`)
      project.run(`tnp build:${outDir}${watch ? ':watch' : ''}${prod ? ':prod' : ''} --environmentName ${environmentName} --noConsoleClear`).sync()
    })

    projectsApps.forEach((project) => {
      info(`START OF APP PROJECT BUILD: ${project.name}, type: ${project.type}`);
      console.log(`[[[${JSON.stringify({ value: (count++ / sum) * 100, info: `In progress building app: ${project.name}`, status: 'inprogress' })}]]]`)
      project.run(`tnp build:app${watch ? ':watch' : ''}${prod ? ':prod' : ''} --environmentName ${environmentName} --noConsoleClear`).sync()
    })

    console.log(`[[[${JSON.stringify({ value: 100, info: `Process Complete`, status: 'complete' })}]]]`)

  }
}
