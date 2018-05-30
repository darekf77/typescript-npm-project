import * as child from 'child_process';
import * as portfinder from 'portfinder';
import { error } from "../messages";
import { EnvConfigProject } from "../models";
import * as httpProxy from 'http-proxy';
import * as http from 'http';
import { ProjectWorkspace, Project } from '.';
import chalk from 'chalk';
import * as _ from 'lodash';


export abstract class BaseProjectRouter {

  abstract name: string;
  protected routes: EnvConfigProject[] = [];
  public defaultPort: number;

  public static killProcessOn(portNumber: number) {
    let pid = child.execFileSync(`lsof -t -i tcp:${portNumber}`).toString();
    child.execSync('kill -kill `lsof -t -i tcp:${portNumber}`');
  }

  private static takenPorts = [];

  public static async getFreePort(from: number = 4000) {
    try {
      // console.log(ProjectRouter.takenPorts)
      while (BaseProjectRouter.takenPorts.includes(from)) {
        from += 1;
      }
      // console.log('from ', from)
      BaseProjectRouter.takenPorts.push(from)
      const port = await portfinder.getPortPromise({ port: from })
      BaseProjectRouter.takenPorts.push(port);
      return port;
    } catch (err) {
      error(err)
    }
  }


  private async runOnRoutes(projects: EnvConfigProject[]) {
    if (projects.length === 0) return;
    const childrenProjectName = projects.shift();
    const port = await BaseProjectRouter.getFreePort();
    const worksapce: Project = this as any;
    const project = worksapce.children.find(({ name }) => name === childrenProjectName.name);
    console.log(`Auto assigned port ${port} for ${project.name}`)
    this.runOnRoutes(projects);
  }

  private getProjectFrom(req: http.IncomingMessage): BaseProjectRouter {
    // console.log('req', req)
    // console.log('getProjectFrom routes', this.routes.map(r => r.baseUrl))
    console.log(`Request url "${req.url}"`)
    const r = this.routes.find(r => {
      return new RegExp(`${r.baseUrl}.*`, 'g').test(req.url)
    })
    if (r) {
      // console.log('Founded route ', r.name)
      const worksapce: Project = this as any;
      return worksapce.children.find(p => p.name === r.name);
    }
  }

  protected activateServer() {
    // console.log('activate server this.routes', this.routes.map(r => r.name))
    const workspace: Project = this as any;
    if (workspace.type === 'workspace') {
      const proxy = httpProxy.createProxyServer({});
      const server = http.createServer((req, res) => {
        // console.log(req.url)
        const p = this.getProjectFrom(req);
        // console.log('Resolved project !', p && p.name)
        const target = `http://localhost:${p.defaultPort}`
        console.log('taget: ', target)
        if (p) {
          proxy.web(req, res, { target });
        } else {
          res.write('not found')
          res.end();
        }
      });
      server.listen(this.defaultPort).on('error', e => {
        console.log('error', e)
      })
      // this.runOnRoutes(_.cloneDeep(this.routes))
    } else {
      error(`Bad project type "${workspace.type}" for server activation.`, true)
      error(`Project "${workspace.name}" is not a ${chalk.bold('workspace')} type project.`)
    }
  }

  private async portTests() {
    console.log(await BaseProjectRouter.getFreePort())
    console.log(await BaseProjectRouter.getFreePort())
    console.log(await BaseProjectRouter.getFreePort())
  }

}
