import * as _ from 'lodash';
// local
import { Project } from "./base-project";
import { BuildOptions } from "../models";
import { ReorganizeArray } from "../helpers";
import { config } from '../config';


export class ProjectWorkspace extends Project {

  startOnCommand() {
    this.env.prepare({} as any);
    this.routes = this.env.configFor.backend.workspace.projects;
    // console.log('this.routes', this.routes.map(r => r.name))
    this.activateServer()
    const workspace: Project = this as any;
    workspace.children
      .filter(child => {
        return !!workspace.env.workspaceConfig.workspace.projects.find(c => c.name === child.name);
      })
      .forEach(child => child.start());
    return 'echo "Workspace server started"';
  }
  projectSpecyficFiles(): string[] {
    return [];
  }

  buildSteps(buildOptions?: BuildOptions) {

    const { environmentName, prod, watch, outDir } = buildOptions;

    console.log('Projects to build:')
    this.children.forEach((project, i) => {
      console.log(`${i + 1}. ${project.name}`)
    })
    console.log('===================')
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
    ];

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

    projectsLibs.forEach((project, i) => {
      if (project.type === 'isomorphic-lib') { // TODO QUICK_FIX morphi browser cwd build isnt working, tsc update needed
        project.run(`tnp build:${outDir}${watch ? ':watch' : ''}${prod ? ':prod' : ''} --environmentName ${environmentName} --noConsoleClear`).sync()
      } else {
        project.build({
          watch: false,
          appBuild: false,
          prod,
          outDir: 'dist',
          environmentName
        });
      }
    })

    projectsApps.forEach((project) => {
      project.build({
        watch: false,
        appBuild: true,
        prod,
        outDir: 'dist',
        environmentName
      });
    })

    if (watch) {
      projectsInOrder.forEach((project, i) => {
        console.log(`${i + 1}. project: ${project.name}`)
        let appBuild = config.allowedTypes.app.includes(project.type);

        project.build({
          watch: true,
          appBuild,
          prod,
          outDir: 'dist',
          environmentName
        });
      })
      this.activateServer()
    }
  }
}
