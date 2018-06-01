import * as child from 'child_process';
import * as portfinder from 'portfinder';
import { error } from "../messages";
import { EnvConfigProject, LibType } from "../models";
import * as httpProxy from 'http-proxy';
import * as http from 'http';
import { Project } from './base-project';
import chalk from 'chalk';
import * as _ from 'lodash';


export class ProxyRouter {

  constructor(private project: Project) {

  }

  protected routes: EnvConfigProject[] = [];

  public killProcessOn(portNumber: number) {
    console.log(`Trying to kill process on port: ${portNumber}`)
    try {
      let pid = child.execFileSync(`lsof -t -i tcp:${portNumber}`).toString();
      child.execSync('kill -kill `lsof -t -i tcp:${portNumber}`');
      // console.log('Succedd')
    } catch (error) {
      // console.log('Error')
    }

  }

  private static takenPorts = [];

  public static async getFreePort(from: number = 4000) {
    try {
      // console.log(ProjectRouter.takenPorts)
      while (ProxyRouter.takenPorts.includes(from)) {
        from += 1;
      }
      // console.log('from ', from)
      ProxyRouter.takenPorts.push(from)
      const port = await portfinder.getPortPromise({ port: from })
      ProxyRouter.takenPorts.push(port);
      return port;
    } catch (err) {
      error(err)
    }
  }


  private async runOnRoutes(projects: EnvConfigProject[]) {
    if (projects.length === 0) return;
    const childrenProjectName = projects.shift();
    const port = await ProxyRouter.getFreePort();
    const worksapce: Project = this as any;
    const project = worksapce.children.find(({ name }) => name === childrenProjectName.name);
    console.log(`Auto assigned port ${port} for ${project.name}`)
    this.runOnRoutes(projects);
  }

  private getProjectFrom(req: http.IncomingMessage): Project {
    // console.log('req', req)
    // console.log('getProjectFrom routes', this.routes.map(r => r.baseUrl))
    console.log(`Request url "${req.url}"`)
    const r = this.routes.find(r => {
      return new RegExp(`${r.baseUrl}.*`, 'g').test(req.url)
    })
    if (r) {
      req.url = req.url.replace(r.baseUrl, '');
      // console.log('Founded route ', r.name)
      const worksapce: Project = this as any;
      const project = worksapce.children.find(p => p.name === r.name);
      return project;
    }
  }

  defaultPortByType(): number {
    const type: LibType = this.project.type;
    if (type === 'workspace') return 5000;
    if (type === 'angular-cli') return 4200;
    if (type === 'angular-client') return 4300;
    if (type === 'angular-lib') return 4250;
    if (type === 'ionic-client') return 8080;
    if (type === 'docker') return 5000;
    if (type === 'isomorphic-lib') return 4000;
    if (type === 'server-lib') return 4050;
  }

  public activateServer() {
    this.project.env.prepare({} as any);
    this.routes = this.project.env.configFor.backend.workspace.projects;

    // console.log('activate server this.routes', this.routes.map(r => r.name))
    const workspace: Project = this as any;
    if (workspace.type === 'workspace') {
      this.server()

      // this.runOnRoutes(_.cloneDeep(this.routes))
    } else {
      error(`Bad project type "${workspace.type}" for server activation.`, true)
      error(`Project "${workspace.name}" is not a ${chalk.bold('workspace')} type project.`)
    }
  }

  private server() {
    const proxy = httpProxy.createProxyServer({});
    const server = http.createServer((req, res) => {
      console.log(req.url)
      const p = this.getProjectFrom(req);
      console.log('Resolved project !', p && p.name)

      if (p) {
        const target = `http://localhost:${p.defaultPort}`
        console.log('taget: ', target)
        proxy.web(req, res, { target });
      } else {
        res.write('not found')
        res.end();
      }
    });
    server.listen(this.project.defaultPort).on('error', e => {
      console.log('error', e)
    })
  }

  private async portTests() {
    console.log(await ProxyRouter.getFreePort())
    console.log(await ProxyRouter.getFreePort())
    console.log(await ProxyRouter.getFreePort())
  }

}
