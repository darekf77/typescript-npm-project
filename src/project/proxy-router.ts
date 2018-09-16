//#region @backend
import * as child from 'child_process';
import * as portfinder from 'portfinder';
import { error } from "../messages";
import { EnvConfigProject, LibType } from "../models";
import * as httpProxy from 'http-proxy';
import * as http from 'http';
import { Project } from './base-project';
import chalk from 'chalk';
import * as _ from 'lodash';
import { killonport } from '../scripts/KILL';


export class ProxyRouter {

  constructor(private project: Project) {

  }

  protected routes: EnvConfigProject[] = [];

  private static takenPorts = [];

  public static async getFreePort(from: number = 4000) {
    try {

      // console.log(ProjectRouter.takenPorts)
      while (this.takenPorts.includes(from)) {
        from += 1;
      }
      // console.log('from ', from)
      this.takenPorts.push(from)
      const port = await portfinder.getPortPromise({ port: from })
      this.takenPorts.push(port);
      return port;
    } catch (err) {
      error(err)
    }
  }


  // private async runOnRoutes(projects: EnvConfigProject[]) {
  //   if (projects.length === 0) return;
  //   const childrenProjectName = projects.shift();
  //   const port = await ProxyRouter.getFreePort();

  //   const project = this.project.children.find(({ name }) => name === childrenProjectName.name);
  //   console.log(`Auto assigned port ${port} for ${project.name}`)
  //   this.runOnRoutes(projects);
  // }


  private getProjectFrom(req: http.IncomingMessage): Project {
    // console.log('req', req)
    // console.log('getProjectFrom routes', this.routes.map(r => r.baseUrl))
    // console.log(`Request url "${req.url}"`)
    const r = this.routes.find(r => {
      return new RegExp(`${r.baseUrl}.*`, 'g').test(req.url)
    })
    if (r) {
      // req.url = req.url.replace(r.baseUrl, '');
      // console.log('Founded route ', r.name)

      const project = this.project.children.find(p => p.name === r.name);
      return project;
    }
  }



  public activateServer() {

    this.routes = this.project.env.config.workspace.projects;

    // console.log('activate server this.routes', this.routes.map(r => r.name))

    if (this.project.type === 'workspace') {
      this.server()

      // this.runOnRoutes(_.cloneDeep(this.routes))
    } else {
      error(`Bad project type "${this.project.type}" for server activation.`, true)
      error(`Project "${this.project.name}" is not a ${chalk.bold('workspace')} type project.`)
    }
  }

  private server() {
    const proxy = httpProxy.createProxyServer({ ws: true });

    const server = http.createServer((req, res) => {
      const p = this.getProjectFrom(req);
      // console.log('Resolved project !' + p.name + ` from url: ${req.url}`)
      if (p) {

        const target = p.routerTargetHttp();
        proxy.web(req, res, {
          target,
          ws: true
        });
      } else {
        res.write('not found')
        res.end();
      }
    });

    // server.on('upgrade', (req, socket, head) => {
    //   const p = this.getProjectFrom(req);
    //   console.log('resolve project from ws ', p && p.name)

    //   const target = p ? p.routerTargetWebSocket() : ''
    //   proxy.ws(req, socket, head, {
    //     target,
    //     ws: true
    //   });

    // });


    server.listen(this.project.getDefaultPort(), () => {
      console.log(`Proxy Router activate on http://localhost:${this.project.getDefaultPort()}`)
    }).on('error', e => {
      console.log('error', e)
    })
  }

  // private async portTests() {
  //   console.log(await ProxyRouter.getFreePort())
  //   console.log(await ProxyRouter.getFreePort())
  //   console.log(await ProxyRouter.getFreePort())
  // }

}
//#endregion
