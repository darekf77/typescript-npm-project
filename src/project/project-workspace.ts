//#region @backend
import * as _ from 'lodash';
// local
import { Project } from "./base-project";
import { BuildOptions } from "../models";
import { ReorganizeArray } from "../helpers";
import { config } from '../config';
import { info, warn } from '../messages';
import { PROGRESS_BAR_DATA } from '../progress-output';
import { ProxyRouter } from './proxy-router';


export class ProjectWorkspace extends Project {

  startOnCommand(args: string) {

    this.proxyRouter.activateServer(async (port) => {
      if (this.env.config.name !== 'local') {
        const address = `${this.env.config.ip}:${port}`;
        const domain = this.env.config.domain;
        if (_.isString(domain) && domain.trim() !== '') {
          console.log(`Activation https domain "${domain}" for address "${address}"`)
          const proxy = require('redbird')({ port });
          const letsencryptPort = await ProxyRouter.getFreePort()
          console.log(`Port for letsencrypt: ${letsencryptPort}`)

          proxy.register(domain, address, {
            letsencrypt: {
              port: letsencryptPort
            },
            ssl: {
              // http2: true,
              port: 443,
              letsencrypt: {
                email: 'darekf77@gmail.com', // Domain owner/admin email
                production: (this.env.config.name === 'prod'), // WARNING: Only use this flag when the proxy is verified to work correctly to avoid being banned!
              }
            }
          });
        } else {
          warn(`Domain is missing or is invalid in config for environment: "${this.env.config.name}"
            Your domain value: ${domain}
          `)
        }

      }

    })
    const workspace: Project = this as any;
    workspace.children
      .filter(child => {
        return !!workspace.env.config.workspace.projects.find(c => c.name === child.name);
      })
      .forEach(child => {
        child.start(args)
      });
    return undefined;
  }
  projectSpecyficFiles(): string[] {
    return ['environment.d.ts'];
  }

  buildSteps(buildOptions?: BuildOptions) {
    PROGRESS_BAR_DATA.log({ info: 'Process started', status: 'inprogress', value: 0 })
    const { prod, watch, outDir, args } = buildOptions;

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
      return !!this.env.config.workspace.projects.find(wp => wp.name === p.name)
    });


    PROGRESS_BAR_DATA.log({ value: 0, info: `Process started`, status: 'inprogress' })

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

    const sum = 2 * (projectsLibs.length + projectsApps.length);
    let count = 1;



    projectsLibs.forEach((project, i) => {
      info(`START OF LIB PROJECT BUILD: ${project.name}, type: ${project.type}`);
      PROGRESS_BAR_DATA.log({ value: (count++ / sum) * 100, info: `In progress building lib: ${project.name}`, status: 'inprogress' })
      project.run(`tnp build:${outDir}${watch ? ':watch' : ''}${prod ? ':prod' : ''} --noConsoleClear ${args}`).sync()
      PROGRESS_BAR_DATA.log({ value: (count++ / sum) * 100, info: `Finish building lib: ${project.name}`, status: 'inprogress' });
    })

    projectsApps.forEach((project) => {
      info(`START OF APP PROJECT BUILD: ${project.name}, type: ${project.type}`);
      PROGRESS_BAR_DATA.log({ value: (count++ / sum) * 100, info: `In progress building app: ${project.name}`, status: 'inprogress' });
      project.run(`tnp build:app${watch ? ':watch' : ''}${prod ? ':prod' : ''}  --noConsoleClear  ${args}`).sync()
      PROGRESS_BAR_DATA.log({ value: (count++ / sum) * 100, info: `Finish building app: ${project.name}`, status: 'inprogress' });
    })

    PROGRESS_BAR_DATA.log({ value: 100, info: `Process Complete`, status: 'complete' });

  }
}
//#endregion
