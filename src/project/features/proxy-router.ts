//#region @backend
import chalk from 'chalk';
import * as _ from 'lodash';
import * as portfinder from 'portfinder';
import * as httpProxy from 'http-proxy';
import * as http from 'http';

import { Helpers } from 'tnp-helpers';
import { Project, FeatureForProject } from '../abstract';

export class ProxyRouter extends FeatureForProject {

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
      Helpers.error(err)
    }
  }


  private getProjectFrom(req: http.IncomingMessage): Project {
    // console.log('req', req)
    // console.log('getProject.From routes', this.routes.map(r => r.baseUrl))
    // console.log(`Request url "${req.url}"`)
    const r = this.project.env.config.workspace.projects.find(r => {
      return new RegExp(`${r.baseUrl}.*`, 'g').test(req.url)
    })
    if (r) {
      // req.url = req.url.replace(r.baseUrl, '');
      // console.log('Founded route ', r.name)

      const project = this.project.children.find(p => p.name === r.name);
      return project;
    }
  }



  public async activateServer(onServerReady: (serverPort?: number) => void) {

    // console.log('activate server this.routes', this.routes.map(r => r.name))

    if (this.project.type === 'workspace') {

      this.server(onServerReady)
    } else {
      Helpers.error(`Bad project type "${this.project.type}" for server activation.`, true)
      Helpers.error(`Project "${this.project.name}" is not a ${chalk.bold('workspace')} type project.`)
    }
  }

  private getTarget(req: http.IncomingMessage): string {
    const p = this.getProjectFrom(req);
    return p ? p.routerTargetHttp() : void 0;
  }

  private server(onServerReady: (serverPort?: number) => void) {
    const proxy = httpProxy.createProxyServer({});

    const server = http.createServer((req, res) => {
      const target = this.getTarget(req);
      if (target) {
        proxy.web(req, res, { target });
      } else {
        res.write('not found')
        res.end();
      }
    });

    server.on('upgrade', (req, socket, head) => {
      const target = this.getTarget(req)
      proxy.ws(req, socket, head, target ? { target } : void 0);
    });

    const serverPort = this.project.getDefaultPort();

    server.listen(serverPort, () => {
      console.log(`Proxy Router activate on ${this.project.env.config.workspace.workspace.host}`)
      if (_.isFunction(onServerReady)) {
        onServerReady(serverPort);
      }
    }).on('error', e => {
      console.log('proxy server error', e)
    })
  }

  // private async portTests() {
  //   console.log(await ProxyRouter.getFreePort())
  //   console.log(await ProxyRouter.getFreePort())
  //   console.log(await ProxyRouter.getFreePort())
  // }

}
//#endregion
