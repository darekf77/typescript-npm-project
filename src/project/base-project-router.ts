import * as child from 'child_process';
import * as portfinder from 'portfinder';
import { error } from "../messages";
import { TnpRoute } from "../models";
import * as httpProxy from 'http-proxy';
import * as http from 'http';
import { ProjectWorkspace, Project } from '.';
import chalk from 'chalk';


export abstract class BaseProjectRouter {

    abstract name: string;
    protected routes: TnpRoute[] = [];
    protected defaultPort: number;

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


    protected currentPort: number;


    private async runOnRoutes(projects: TnpRoute[]) {
        if (projects.length === 0) return;
        const childrenProjectName = projects.shift();
        const port = await BaseProjectRouter.getFreePort();
        const worksapce: Project = this as any;
        const project = worksapce.children.find(({ name }) => name === childrenProjectName.project);
        console.log(`port ${port} for ${project.name}`)
        this.runOnRoutes(projects);
    }

    private getProjectFrom(req: http.IncomingMessage): BaseProjectRouter {
        const r = this.routes.find(r => {
            return new RegExp(`${r.url}/.*`, 'g').test(req.url)
        })
        if (r) {
            return r.project as any;
        }
    }

    protected activateServer() {
        const project: ProjectWorkspace = this as any;
        if ((project as ProjectWorkspace).type === 'workspace') {
            const proxy = httpProxy.createProxyServer({});
            const server = http.createServer((req, res) => {
                const p = this.getProjectFrom(req);
                if (p) {
                    proxy.web(req, res, { target: `http://localhost:${p.currentPort}` });
                } else {
                    res.write('not found')
                    res.end();
                }
            });
            server.listen(this.currentPort)
            this.runOnRoutes(this.routes)
        } else {
            error(`Bad project type "${project.type}" for server activation.`, true)
            error(`Project "${project.name}" is not a ${chalk.bold('workspace')} type project.`)
        }
    }

    private async portTests() {
        console.log(await BaseProjectRouter.getFreePort())
        console.log(await BaseProjectRouter.getFreePort())
        console.log(await BaseProjectRouter.getFreePort())
    }

}